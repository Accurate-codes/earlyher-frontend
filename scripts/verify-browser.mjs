/**
 * Browser checks against a running production build (`npm run build && npm start`).
 *
 *   node scripts/verify-browser.mjs [--base http://localhost:3000] [--fixtures] [--timeout]
 *
 * Uses the Chrome or Edge already installed on the machine through playwright-core,
 * so no browser download is needed. Screenshots go to verification/screens/.
 * --fixtures runs the questionnaire checks; the build must have NEXT_PUBLIC_SHOW_DEV_FIXTURES=true.
 * --timeout also waits through the real inactivity timeout (about 2.5 minutes).
 *
 * Map tile requests are blocked except in one check, so automated runs do not load
 * the tile provider (the OpenStreetMap tile policy asks for light use only).
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3000";
const checkFixtures = args.includes("--fixtures");
const checkTimeout = args.includes("--timeout");
const outDir = "verification/screens";
mkdirSync(outDir, { recursive: true });

const DISCLAIMER =
  "This tool does not diagnose. It helps you understand your symptoms and connects you to professional care as fast as possible.";
const REMOVED = [
  "Your breast health",
  "Learn about your breast health",
  "How EarlyHer helps",
  "Changes to look out for",
  "Made for where you are",
  "Private and simple",
  "Common questions",
  "Ready when you are",
];
const LAGOS = { latitude: 6.5244, longitude: 3.3792 };

const viewports = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 1024],
  [1920, 1080],
];
const pages = ["/", "/concern", "/no-concern", "/healthcare", "/next-step"];

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

async function newContext(browser, options = {}, { allowTiles = false } = {}) {
  const context = await browser.newContext(options);
  if (!allowTiles) await context.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  return context;
}

async function overflow(page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (el.closest(".leaflet-container")) continue;
      if (rect.width > 0 && rect.right > width + 1 && getComputedStyle(el).position !== "fixed") {
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 2).join(".")}`);
      }
    }
    return { scroll: document.documentElement.scrollWidth, width, offenders: offenders.slice(0, 3) };
  });
}

const bodyText = (page) => page.evaluate(() => document.body.innerText);

const browser = await launch();

try {
  // 1. Layout at every viewport, and no user-facing cancer wording or old sections.
  for (const [width, height] of viewports) {
    const context = await newContext(browser, { viewport: { width, height } });
    const page = await context.newPage();
    for (const path of pages) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      if (path === "/healthcare") await page.getByText(/facilities$/).first().waitFor({ timeout: 20000 });
      const o = await overflow(page);
      record(`no horizontal overflow ${path} @${width}x${height}`, o.scroll <= o.width, o.offenders.join(", "));
      await page.screenshot({ path: `${outDir}/${width}x${height}${path.replaceAll("/", "_") || "_home"}.png`, fullPage: true, timeout: 120000 });
      if (width === 390) {
        const text = await bodyText(page);
        record(`no "cancer" wording on ${path}`, !/cancer/i.test(text));
      }
    }
    await context.close();
  }

  // 2. Home screen: compact, three choices, no promotional sections or top navigation.
  {
    const context = await newContext(browser, { viewport: { width: 1280, height: 1024 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    record("home heading", await page.getByRole("heading", { name: "Where would you like to start?" }).isVisible());
    record(
      "home supporting text",
      await page.getByText("Choose the option that fits you best. You can come back and choose another at any time.").isVisible(),
    );
    record("privacy message", await page.getByText("Private, no accounts needed").isVisible());
    for (const name of ["I have a breast concern", "I don't have a concern", "Find healthcare"]) {
      record(`choice "${name}"`, await page.getByRole("link", { name: new RegExp(name) }).isVisible());
    }
    const text = await bodyText(page);
    for (const removed of REMOVED) record(`removed: "${removed}"`, !text.includes(removed));
    record("no phone mock-up", (await page.locator(".phone-float, .phone-rise").count()) === 0);
    record("no main navigation tabs", (await page.getByRole("navigation", { name: "Main" }).count()) === 0);
    record("no Online indicator", !(await page.getByText("Online", { exact: true }).count()));
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    record("home fits one desktop screen", scrollHeight <= 1024, `${scrollHeight}px`);
    await context.close();
  }

  // 3. Language selector: persists across screens and reloads; English fallback is labelled.
  {
    const context = await newContext(browser, { viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    const yo = page.getByRole("button", { name: "Yorùbá" });
    const en = page.getByRole("button", { name: "English" });
    record("English selected by default", (await en.getAttribute("aria-pressed")) === "true");
    await yo.click();
    record("Yorùbá can be selected", (await yo.getAttribute("aria-pressed")) === "true");
    record("missing Yoruba is announced, not hidden", await page.getByText(/reviewed translations are not ready yet/).isVisible());
    record("page language stays English while text is English", (await page.evaluate(() => document.documentElement.lang)) === "en");
    await page.getByRole("link", { name: /Find healthcare/ }).click();
    await page.waitForURL(/\/healthcare/);
    record("language kept when moving through the app", (await page.getByRole("button", { name: "Yorùbá" }).getAttribute("aria-pressed")) === "true");
    await page.reload({ waitUntil: "networkidle" });
    record("language kept after reload", (await page.getByRole("button", { name: "Yorùbá" }).getAttribute("aria-pressed")) === "true");
    await page.screenshot({ path: `${outDir}/390x844_yoruba-selected.png`, fullPage: false, timeout: 120000 });
    await page.getByRole("button", { name: "English" }).click();
    record("notice hidden in English", !(await page.getByText(/reviewed translations are not ready yet/).count()));
    await context.close();
  }

  // 4. Entry points, Back/Home, pending states, disclaimer and care options.
  {
    const context = await newContext(browser, { viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /I have a breast concern/ }).click();
    await page.getByRole("heading", { name: "Questionnaire content is being prepared" }).waitFor();
    record("concern: honest pending state", true);
    record("concern: exact disclaimer", await page.getByText(DISCLAIMER, { exact: true }).filter({ visible: true }).first().isVisible());
    record("concern: telemedicine unavailable stated", await page.getByText("Online consultations are not available through EarlyHer yet.").isVisible());
    record("concern: no invented provider link", (await page.locator('a[target="_blank"]').count()) === 0);
    await page.getByRole("link", { name: "Find a facility" }).click();
    await page.waitForURL(/\/healthcare/);
    record("concern: facility option opens finder", true);
    await page.goBack();
    await page.getByRole("link", { name: "Back" }).click();
    await page.waitForURL(base + "/");
    record("concern: Back returns home", true);

    await page.getByRole("link", { name: /I don't have a concern/ }).click();
    await page.getByRole("heading", { name: "This section is being prepared" }).waitFor();
    record("no-concern: honest pending state", true);
    await page.getByRole("navigation", { name: "Page navigation" }).getByRole("link", { name: "Home" }).click();
    await page.waitForURL(base + "/");
    record("no-concern: Home returns home", true);

    await page.goto(base + "/next-step", { waitUntil: "networkidle" });
    record("results without answers shows no result", await page.getByRole("heading", { name: "There are no next steps to show" }).isVisible());
    await context.close();
  }

  // 5. Facility finder: search, LGA, list/map link, details, directions, distance.
  {
    const context = await newContext(browser, {
      viewport: { width: 1280, height: 900 },
      geolocation: LAGOS,
      permissions: ["geolocation"],
    });
    const page = await context.newPage();
    await page.goto(base + "/healthcare", { waitUntil: "networkidle" });
    const count = page.locator("#facility-list-heading + p");
    await page.getByText(/2,798 facilities/).waitFor({ timeout: 20000 });
    record("finder loads Lagos snapshot", true, await count.innerText());
    record("map container present", (await page.locator(".leaflet-container").count()) === 1);
    record("tile errors are reported, list still works", await page.getByText("The map needs an internet connection").isVisible());
    record("coverage and licence shown", await page.getByText(/CC BY 4\.0/).isVisible());
    record("not-complete warning shown", await page.getByText(/This list is not complete/).first().isVisible());

    await page.getByLabel("Search by facility name, ward or area").fill("surulere");
    await page.waitForTimeout(400);
    const searched = await count.innerText();
    record("search narrows the list", !searched.startsWith("2,798"), searched);

    await page.getByLabel("Search by facility name, ward or area").fill("");
    await page.getByLabel("Local government area (LGA)").selectOption("Ikeja");
    await page.waitForTimeout(400);
    const lgaText = await count.innerText();
    record("LGA filter works", /193 facilities/.test(lgaText), lgaText);

    const first = page.locator("ul > li h3 button").first();
    await first.click();
    record("item expands (aria-expanded)", (await first.getAttribute("aria-expanded")) === "true");
    const directions = await page.getByRole("link", { name: /Get directions/ }).first().getAttribute("href");
    record("directions use coordinates", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=6\.\d+%2C3\.\d+$/.test(directions ?? ""), directions);
    record("no unverified phone shown", !(await page.locator("dt", { hasText: /^Phone$/ }).count()));
    record("breast-care caveat shown", await page.getByText("Being listed here does not mean a facility offers specialist breast care.").first().isVisible());
    record("address gap stated", await page.getByText("Street address not available in this data").first().isVisible());
    await page.screenshot({ path: `${outDir}/1280x900_finder-selected.png`, fullPage: false, timeout: 120000 });

    await page.getByRole("button", { name: "Use my location" }).click();
    await page.getByText(/Sorted by straight-line distance/).waitFor();
    record("location sorts by straight-line distance", await page.getByText(/in a straight line/).first().isVisible());
    record("location not stored", (await page.evaluate(() => JSON.stringify({ ...localStorage }))).includes("6.52") === false);

    await page.keyboard.press("Tab");
    await context.close();
  }
  {
    const context = await newContext(browser, { viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base + "/healthcare", { waitUntil: "networkidle" });
    await page.getByText(/2,798 facilities/).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Use my location" }).click();
    await page.getByText(/Location permission was not given|could not be found/).waitFor({ timeout: 20000 });
    record("location denial handled; manual search still available", await page.getByLabel(/Search by facility name/).isVisible());
    await context.close();
  }
  // One real map render (a handful of tiles) for a visual check of the map.
  {
    const context = await newContext(browser, { viewport: { width: 1280, height: 900 } }, { allowTiles: true });
    const page = await context.newPage();
    await page.goto(base + "/healthcare", { waitUntil: "networkidle" });
    await page.getByLabel("Local government area (LGA)").selectOption("Surulere");
    await page.waitForTimeout(2500);
    record("map attribution visible", await page.locator(".leaflet-control-attribution", { hasText: "OpenStreetMap" }).isVisible());
    await page.screenshot({ path: `${outDir}/1280x900_finder-map.png`, fullPage: false, timeout: 120000 });
    await context.close();
  }

  // 6. Questionnaire behaviour, using the labelled development fixture.
  if (checkFixtures) {
    const context = await newContext(browser, { viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(base + "/concern", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Interface test \(not clinical\)/ }).click();
    await page.getByRole("heading", { name: /Test question 1/ }).waitFor();
    record("fixture is labelled as not clinical", await page.getByText(/Development fixture/).isVisible());
    record("disclaimer beneath questions", await page.getByText(DISCLAIMER, { exact: true }).filter({ visible: true }).first().isVisible());

    await page.getByRole("button", { name: "Next" }).click();
    record("required answer enforced", await page.getByRole("alert").getByText("Please choose an answer to continue.").isVisible());

    await page.getByText("Yes", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("heading", { name: /Test follow-up/ }).waitFor();
    record("conditional follow-up appears after Yes", true);
    await page.getByText("Option two", { exact: true }).click();
    await page.getByRole("button", { name: "Back" }).last().click();
    record("Back keeps the earlier answer", await page.getByRole("radio", { name: "Yes" }).isChecked());

    await page.getByText("No", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("heading", { name: /Test question 2/ }).waitFor();
    record("follow-up skipped after No", true);
    await page.getByText("Option A", { exact: true }).click();
    await page.getByText("Option B", { exact: true }).click();
    record("several answers can be chosen", (await page.getByRole("checkbox", { checked: true }).count()) === 2);
    await page.getByText("None of these", { exact: true }).click();
    record("exclusive option clears the others", (await page.getByRole("checkbox", { checked: true }).count()) === 1);
    await page.getByText("Option B", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("heading", { name: /Optional test follow-up/ }).waitFor();
    await page.getByRole("button", { name: "Next" }).click();
    record("optional question can be skipped", await page.getByRole("heading", { name: /Test question 3/ }).isVisible());
    await page.getByText("Yes", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("heading", { name: "Check your answers" }).waitFor();
    record("review step shown", true);
    record("review lists answers", await page.getByText("Option B", { exact: true }).isVisible());
    await page.screenshot({ path: `${outDir}/390x844_review.png`, fullPage: true, timeout: 120000 });

    await page.getByRole("button", { name: /Change: Test question 1/ }).click();
    await page.getByText("Yes", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("heading", { name: /Test follow-up/ }).waitFor();
    record("previously cleared follow-up is asked again, empty", !(await page.getByRole("radio", { checked: true }).count()));
    await page.getByText("Option one", { exact: true }).click();
    await page.getByRole("button", { name: "Back to check your answers" }).click();
    await page.getByRole("heading", { name: "Check your answers" }).waitFor();
    record("edit from review can return straight to review", true);
    await page.getByRole("button", { name: "See my next steps" }).click();
    await page.getByRole("heading", { name: "Your next steps" }).waitFor();
    record("result shown from declared fixture rules", await page.getByText("Test result A").isVisible());
    record("result fixture labelled", await page.getByText("Development fixture result. Not clinical guidance.").isVisible());
    record("result offers telemedicine and facility", await page.getByRole("link", { name: "Find a facility" }).isVisible());
    record("result disclaimer", await page.getByText(DISCLAIMER, { exact: true }).filter({ visible: true }).first().isVisible());
    await page.screenshot({ path: `${outDir}/390x844_result.png`, fullPage: true, timeout: 120000 });

    await page.getByRole("button", { name: "Back to my answers" }).click();
    await page.getByRole("heading", { name: "Check your answers" }).waitFor();
    record("results Back returns to review with answers", await page.getByText("Option one", { exact: true }).isVisible());

    record("answers not written to storage", (await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).includes("Option") === false);
    await page.getByRole("button", { name: "Finish" }).click();
    await page.getByRole("button", { name: "Yes, finish" }).click();
    await page.waitForURL(base + "/");
    await page.goto(base + "/next-step", { waitUntil: "networkidle" });
    record("finish clears answers", await page.getByRole("heading", { name: "There are no next steps to show" }).isVisible());

    // Demo states for the facility finder (development panel).
    await page.goto(base + "/healthcare", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Demo states/ }).click();
    for (const [state, text] of [
      ["empty", "There are no facility records to show right now."],
      ["error", "We couldn't load facility information."],
      ["offline", "You are offline, and the facility list has not been saved"],
      ["unavailable", "Facility information is not available right now."],
    ]) {
      await page.getByRole("combobox", { name: "Facilities", exact: true }).selectOption(state);
      await page.getByText(text).waitFor({ timeout: 5000 }).then(
        () => record(`finder ${state} state`, true),
        () => record(`finder ${state} state`, false),
      );
    }
    await context.close();
  }

  // 7. Offline: install, disconnect, then use the app and the cached facility list.
  {
    const context = await newContext(browser, { viewport: { width: 1280, height: 1024 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 60000 });
    await page.waitForTimeout(6000);
    await context.setOffline(true);

    const fresh = await context.newPage();
    await fresh.goto(base, { waitUntil: "domcontentloaded" });
    record("home loads offline", await fresh.getByRole("heading", { name: "Where would you like to start?" }).isVisible());
    await fresh.getByRole("link", { name: /I have a breast concern/ }).click();
    await fresh.getByRole("heading", { name: "Questionnaire content is being prepared" }).waitFor();
    record("concern screen works offline", true);
    await fresh.getByRole("link", { name: "Find a facility" }).click();
    await fresh.getByText(/2,798 facilities/).waitFor({ timeout: 20000 });
    record("cached facility list works offline", true);
    record("map says it needs internet", await fresh.getByText("The map needs an internet connection").isVisible());
    await fresh.screenshot({ path: `${outDir}/offline_finder.png`, fullPage: false, timeout: 120000 });
    await context.close();
  }

  // 8. Inactivity warning and timeout (optional, slow).
  if (checkTimeout) {
    const context = await newContext(browser, { viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    await page.goto(base + "/healthcare", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Are you still there?" }).waitFor({ timeout: 180000 });
    record("inactivity warning appears", true);
    await page.waitForURL(base + "/", { timeout: 60000 });
    record("timeout returns home", true);
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
