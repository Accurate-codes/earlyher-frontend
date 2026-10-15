/**
 * Browser checks against a running production build (`npm run build && npm start`).
 *
 *   node scripts/verify-browser.mjs [--base http://localhost:3000] [--timeout]
 *
 * Uses the Chrome or Edge already installed on the machine through playwright-core,
 * so no browser download is needed. Screenshots go to verification/screens/.
 * --timeout also waits through the real inactivity timeout (about 2.5 minutes).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3000";
const checkTimeout = args.includes("--timeout");
const outDir = "verification/screens";
mkdirSync(outDir, { recursive: true });

const viewports = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 1024],
  [1440, 900],
];
const pages = ["/", "/concern", "/learn", "/learn/changes-to-look-out-for", "/healthcare"];

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function launch() {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // Try the next installed browser.
    }
  }
  throw new Error("No installed Chrome or Edge found.");
}

async function overflow(page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right > width + 1 && getComputedStyle(el).position !== "fixed") {
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 2).join(".")}`);
      }
    }
    return { scroll: document.documentElement.scrollWidth, width, offenders: offenders.slice(0, 3) };
  });
}

/** Walks the lump example from the welcome screen to the next step. */
async function completeLumpJourney(page) {
  await page.getByRole("link", { name: /I have a breast concern/ }).click();
  await page.getByRole("button", { name: "Lump or swelling" }).click();
  await page.getByRole("button", { name: "1–4 weeks ago" }).click();
  await page.getByRole("button", { name: "Has not changed" }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("heading", { name: "Your next step" }).waitFor();
}

const browser = await launch();

try {
  // 1. Layout at every viewport.
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    for (const path of pages) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      const o = await overflow(page);
      record(`no horizontal overflow ${path} @${width}x${height}`, o.scroll <= o.width, o.offenders.join(", "));
      await page.screenshot({ path: `${outDir}/${width}x${height}${path.replaceAll("/", "_") || "_home"}.png`, fullPage: true });
    }

    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /I have a breast concern/ }).click();
    await page.getByRole("button", { name: "Lump or swelling" }).click();
    await page.getByRole("heading", { name: "When did you first notice it?" }).waitFor();
    await page.screenshot({ path: `${outDir}/${width}x${height}_question.png`, fullPage: true });
    let o = await overflow(page);
    record(`no horizontal overflow question @${width}x${height}`, o.scroll <= o.width, o.offenders.join(", "));

    await page.goto(base, { waitUntil: "networkidle" });
    await completeLumpJourney(page);
    await page.getByText("Simulated response").waitFor({ timeout: 10000 }).catch(() => {});
    await page.screenshot({ path: `${outDir}/${width}x${height}_next-step.png`, fullPage: true });
    o = await overflow(page);
    record(`no horizontal overflow next-step @${width}x${height}`, o.scroll <= o.width, o.offenders.join(", "));

    await page.getByRole("button", { name: "Send to my phone" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Send by SMS" }).click();
    for (const digit of "08031234567") await page.getByRole("dialog").getByRole("button", { name: digit, exact: true }).click();
    await page.screenshot({ path: `${outDir}/${width}x${height}_sms-keypad.png` });
    const dialogBox = await page.getByRole("dialog").boundingBox();
    record(`SMS dialog fits viewport @${width}x${height}`, !!dialogBox && dialogBox.width <= width && dialogBox.height <= height);
    await context.close();
  }

  // 2. Journey, AI fallback labelling, SMS honesty, print honesty, finish + Back.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1024 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await completeLumpJourney(page);
    const recommendation = "we recommend speaking with a healthcare professional about this change";
    record("recommendation shown", await page.getByText(recommendation).isVisible());
    await page.getByText("Simulated response").waitFor({ timeout: 10000 });
    record("simulated AI text is labelled", true);

    await page.getByRole("button", { name: "Send to my phone" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Send by SMS" }).click();
    await dialog.getByLabel("Phone number").fill("0803123");
    await dialog.getByRole("button", { name: "Preview message" }).click();
    record("short phone number rejected", await dialog.getByText("The number should have 11 digits.").isVisible());
    await dialog.getByLabel("Phone number").fill("08031234567");
    await dialog.getByRole("button", { name: "Preview message" }).click();
    await dialog.getByRole("button", { name: "Send", exact: true }).click();
    await dialog.getByText("No real SMS was sent").waitFor();
    record("mock SMS says no real SMS was sent", true);
    record("SMS does not claim delivery", !(await dialog.getByText(/delivered/i).count()));
    await dialog.getByRole("button", { name: "Close" }).last().click();

    await page.getByRole("button", { name: "Print", exact: true }).click();
    await page.evaluate(() => {
      window.print = () => {};
    });
    await page.getByRole("dialog").getByRole("button", { name: "Print" }).click();
    record(
      "print does not claim success",
      await page.getByText("We can't tell from here whether the page was printed.").isVisible(),
    );
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).last().click();

    await page.getByRole("button", { name: "Finish" }).first().click();
    await page.getByRole("button", { name: "Yes, finish" }).click();
    await page.waitForURL(base + "/");
    record("finish returns to welcome", true);
    await page.goBack();
    await page.waitForTimeout(800);
    record("Back after finish does not reveal the next step", !(await page.getByText(recommendation).isVisible()));
    await page.goBack();
    await page.waitForTimeout(800);
    record("Back after finish does not reveal answers", !(await page.getByText("1–4 weeks ago").isVisible()));
    await context.close();
  }

  // 3. Changed answer: the edited answer replaces the old one in the review list.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await completeLumpJourney(page);
    await page.goBack();
    await page.getByRole("button", { name: /Change: When did you first notice it/ }).click();
    await page.getByRole("button", { name: "More than 3 months ago" }).click();
    await page.getByRole("heading", { name: "Your next step" }).waitFor();
    await page.goBack();
    record("edited answer is kept", await page.getByText("More than 3 months ago").isVisible());
    record("old answer is gone", !(await page.getByText("1–4 weeks ago").isVisible()));
    await context.close();
  }

  // 4. Offline: install, disconnect, then start a fresh session.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1024 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 60000 });
    await page.waitForTimeout(5000);
    await context.setOffline(true);

    const fresh = await context.newPage();
    await fresh.goto(base, { waitUntil: "domcontentloaded" });
    record("welcome loads offline", await fresh.getByRole("heading", { name: /Your breast health/ }).isVisible());
    record("offline badge shown", await fresh.getByText("Offline", { exact: true }).isVisible());
    await completeLumpJourney(fresh);
    record("assessment and next step work offline", await fresh.getByText("we recommend speaking", { exact: false }).isVisible());
    await fresh.getByText("Extra explanation is not available right now").waitFor({ timeout: 10000 });
    record("AI failure offline does not block the next step", true);
    await fresh.screenshot({ path: `${outDir}/offline_next-step.png`, fullPage: true });

    await fresh.getByRole("link", { name: "Learn more" }).click();
    await fresh.getByRole("link", { name: /Changes to look out for/ }).click();
    record("education works offline", await fresh.getByRole("heading", { name: "Changes to look out for" }).isVisible());

    await fresh.getByRole("link", { name: "Find healthcare" }).first().click();
    await fresh.getByText("You are offline. Facility information needs an internet connection.").waitFor();
    record("facilities report offline honestly", true);

    await fresh.reload({ waitUntil: "domcontentloaded" });
    record("reload while offline still works", await fresh.getByRole("heading", { name: "Find healthcare" }).isVisible());
    await context.close();
  }

  // 5. Inactivity warning and timeout (optional, slow).
  if (checkTimeout) {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await completeLumpJourney(page);
    await page.getByRole("heading", { name: "Are you still there?" }).waitFor({ timeout: 180000 });
    await page.screenshot({ path: `${outDir}/1024x768_timeout-warning.png` });
    record("inactivity warning appears", true);
    await page.waitForURL(base + "/", { timeout: 60000 });
    await page.goBack();
    await page.waitForTimeout(800);
    record("timeout clears the session", !(await page.getByText("we recommend speaking", { exact: false }).isVisible()));
    await context.close();
  }
} catch (error) {
  record("script completed", false, error instanceof Error ? error.message.split("\n")[0] : String(error));
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
