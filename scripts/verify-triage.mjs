/**
 * Browser checks for the breast-concern and self-check journeys, run by verify-browser.mjs.
 * Walks real journeys through the production build: consent, branching, auto-advance,
 * Back, language switching, early Red, results, summary PDF, finder link and saving.
 */
import { readFileSync, rmSync } from "node:fs";

const SAVE_KEY = "earlyher.triage-progress";

export async function checkTriage(browser, { base, outDir, record, newContext, overflow }) {
  const context = await newContext(browser, { viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await context.newPage();
  const h1 = (name) => page.getByRole("heading", { level: 1, name });
  const waitQ = (name) => h1(name).waitFor({ timeout: 8000 });
  const pick = async (question, option) => {
    await waitQ(question);
    await page.getByText(option, { exact: true }).click();
  };
  const pickMany = async (question, options) => {
    await waitQ(question);
    for (const option of options) await page.getByText(option, { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
  };
  const start = async (link, title) => {
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: new RegExp(link) }).click();
    await waitQ(title);
    await page.getByRole("button", { name: /I agree and start|^Continue$/ }).click();
  };
  const finish = async () => {
    await page.getByRole("button", { name: "Finish" }).click();
    await page.getByRole("button", { name: "Yes, finish" }).click();
    await page.waitForURL(base + "/");
  };
  const saved = () => page.evaluate((key) => Object.keys(localStorage).includes(key), SAVE_KEY);

  // Concern journey to a "within 4 weeks" result.
  await start("I have a breast concern", "Let's check your breast concern together");
  record("concern: consent leads to symptom selection", await h1("What brings you here today?").isVisible());
  record("concern: nothing saved without permission", !(await saved()));
  await page.screenshot({ path: `${outDir}/390x844_triage-q1.png`, fullPage: true, timeout: 120000 });
  await page.getByRole("button", { name: "Continue" }).click();
  record("multi-select requires an answer", await page.getByRole("alert").getByText(/Please choose at least one answer/).isVisible());
  await pickMany("What brings you here today?", ["I found a lump or thick area"]);
  await pick("How old are you?", "25 to 39");
  await pick("Do you have a fever or chills right now?", "No");
  await waitQ("Is part of your breast red, hot, swollen, or very painful?");
  record("single choice moves on by itself", true);

  // Back restores the earlier answer; switching language keeps the question and answer.
  await page.getByRole("navigation", { name: "Page navigation" }).getByRole("button", { name: "Back" }).click();
  await waitQ("Do you have a fever or chills right now?");
  record("Back restores the previous answer", await page.getByRole("radio", { name: "No", exact: true }).isChecked());
  await page.getByRole("button", { name: "Yorùbá" }).click();
  record(
    "language switch keeps the question and answer",
    (await h1("Do you have a fever or chills right now?").isVisible()) &&
      (await page.getByRole("radio", { name: "No", exact: true }).isChecked()),
  );
  record("untranslated text is labelled while Yoruba is selected", await page.getByText(/reviewed translations are not ready yet/).isVisible());
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await pick("Is part of your breast red, hot, swollen, or very painful?", "No");
  await pick("Are you pregnant or breastfeeding?", "None of these");
  await waitQ("In the last month, have you had any of these?");
  await page.getByText("Bone pain", { exact: true }).click();
  await page.getByText("None of these", { exact: true }).click();
  record("'None of these' clears other choices", (await page.getByRole("checkbox", { checked: true }).count()) === 1);
  await page.getByText("Bone pain", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await pick("Have you had a knock or injury to your chest lately?", "No");
  await pick("Which side is the lump on?", "Right breast");
  await waitQ("Where in your right breast is it?");
  record("breast diagram labels the armpit side", await page.getByText("Armpit side", { exact: true }).isVisible());
  await page.screenshot({ path: `${outDir}/390x844_triage-diagram.png`, fullPage: true, timeout: 120000 });
  await pick("Where in your right breast is it?", "Upper outer");
  await pick("When did you first notice it?", "Less than 1 week ago");
  await waitQ(/Does the lump get bigger or sore/);
  record("change question skipped for a lump under a week old", true);
  await pick(/Does the lump get bigger or sore/, "Yes");
  await pick("How does the lump feel?", "Soft or squishy");
  await pick("What are the edges of the lump like?", "Smooth, with a clear outline");
  await pick("When you press on it, does it move under your fingers?", "It moves freely");
  // R4 bone pain plus a lump is Orange, so history questions H1–H4 are skipped.
  await pick("Have you had a breast lump, a cyst drained, or a biopsy before?", "No");
  await waitQ(/When was your last mammogram/);
  record("history risk questions skipped when already Orange", true);
  await pick(/When was your last mammogram/, "I've never had one");
  await page.waitForURL(/\/next-step/);
  await waitQ("See a doctor this week");
  record("result: urgency label and timeframe in words", await page.getByText("Within 1 week").isVisible());
  record("result: explains the answers behind it", await page.getByText("You found a lump and have also had other changes in your body in the last month.").isVisible());
  record("result: no cancer wording in headline", !/cancer/i.test(await h1("See a doctor this week").innerText()));
  record("result: answers not in the URL", new URL(page.url()).search === "" && new URL(page.url()).hash === "");
  await page.screenshot({ path: `${outDir}/390x844_result-orange.png`, fullPage: true, timeout: 120000 });

  // Help now does not change the result.
  await page.getByRole("button", { name: "I need help now" }).click();
  record("help now opens urgent guidance", await page.getByRole("dialog").getByRole("heading", { name: "Get help now" }).isVisible());
  await page.getByRole("button", { name: "Back to my questions" }).click();
  record("help now leaves the result unchanged", await h1("See a doctor this week").isVisible());

  // Summary and PDF.
  await page.getByRole("link", { name: "Download my summary" }).click();
  await waitQ("Your summary");
  record("summary keeps duration ranges", await page.getByText("Less than 1 week ago").isVisible());
  record("summary lists other body changes", await page.getByText("Bone pain").isVisible());
  record("summary explains a skipped question", await page.getByText(/Not asked, because it was noticed less than 1 week ago/).isVisible());
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
  const pdfPath = `${outDir}/summary-check.pdf`;
  await download.saveAs(pdfPath);
  const pdf = readFileSync(pdfPath, "latin1");
  rmSync(pdfPath);
  record("PDF downloads with a neutral filename", download.suggestedFilename() === "health-summary.pdf");
  record("PDF is a complete file", pdf.startsWith("%PDF-1.4") && pdf.trimEnd().endsWith("%%EOF"));
  await page.screenshot({ path: `${outDir}/390x844_summary.png`, fullPage: true, timeout: 120000 });

  // Result to healthcare, with the guidance kept in memory only.
  await page.getByRole("link", { name: "Back to my result" }).last().click();
  await waitQ("See a doctor this week");
  await page.getByRole("link", { name: "Find a healthcare facility" }).click();
  await page.waitForURL(/\/healthcare$/);
  record("result opens the facility finder", true);
  record("finder shows the guidance without promising availability", await page.getByText(/does not mean a facility can see you within this time/).isVisible());
  await page.getByRole("link", { name: "Back to my result" }).click();
  await waitQ("See a doctor this week");
  record("finder links back to the result", true);
  await finish();

  // Red early exit, then optional continuation.
  await start("I have a breast concern", "Let's check your breast concern together");
  await pickMany("What brings you here today?", ["My breast hurts"]);
  await pick("How old are you?", "Under 25");
  await pick("Do you have a fever or chills right now?", "I haven't checked, but I feel feverish");
  await pick("Is part of your breast red, hot, swollen, or very painful?", "Yes, it started in the last few days");
  await page.waitForURL(/\/next-step/);
  await waitQ("Get seen today");
  record("Red: urgent result straight after the safety answer", await page.getByText("Today, within 24 hours").isVisible());
  record("Red: finding care in person is the first action", await page.getByRole("link", { name: "Find care near me now" }).isVisible());
  await page.screenshot({ path: `${outDir}/390x844_result-red.png`, fullPage: true, timeout: 120000 });
  await page.getByRole("button", { name: "Answer a few more questions for your doctor" }).click();
  await waitQ("Are you pregnant or breastfeeding?");
  record("Red: continuing resumes at the pregnancy question", true);
  await finish();

  // No-concern journey: uncertainty moves into safety screening, then the skin questions.
  await start("I don't have a concern", "Let's do a breast check-in together");
  await pick("How old are you?", "40 to 49");
  await pick("Do you check your breasts yourself?", "Now and then");
  await waitQ("Do you see any change in your breasts?");
  record("self-check shows the mirror illustration", await page.getByRole("img", { name: /Three ways to stand/ }).isVisible());
  await page.screenshot({ path: `${outDir}/390x844_self-check.png`, fullPage: true, timeout: 120000 });
  await page.getByText("I'm not sure", { exact: true }).click();
  await waitQ("Do you have a fever or chills right now?");
  record("no-concern: uncertainty moves to safety screening", true);
  await pick("Do you have a fever or chills right now?", "No");
  await pick("Is part of your breast red, hot, swollen, or very painful?", "No");
  await pick("Are you pregnant or breastfeeding?", "None of these");
  await pickMany("In the last month, have you had any of these?", ["None of these"]);
  await pick("Have you had a knock or injury to your chest lately?", "No");
  await waitQ("What changes do you see or feel?");
  record("no-concern: change leads to the skin questions", true);

  // Save progress, resume after reload, delete on Finish.
  await page.getByLabel("Save my progress on this device").check();
  record("progress saved only after opting in", await saved());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue where you left off" }).click();
  await waitQ("What changes do you see or feel?");
  record("saved progress resumes at the same question", true);
  await finish();
  record("Finish deletes saved progress", !(await saved()));

  // Routine self-check result.
  await start("I don't have a concern", "Let's do a breast check-in together");
  await pick("How old are you?", "50 to 69");
  await pick("Do you check your breasts yourself?", "Every month");
  await pick("Do you see any change in your breasts?", "No, everything looks normal");
  await pick("Do you feel any lump or thick area?", "No, nothing feels different");
  await pick("When did a health worker last examine your breasts?", "Never");
  await page.waitForURL(/\/next-step/);
  await waitQ("No urgent concern");
  record("routine result: book a routine check", await page.getByText("It's time to book a routine breast check.").isVisible());
  record("routine result: mammogram advice at 40+", await page.getByText("Ask your doctor how often you should have a mammogram.").isVisible());
  await page.screenshot({ path: `${outDir}/390x844_result-green.png`, fullPage: true, timeout: 120000 });
  await finish();

  await page.goto(base + "/next-step", { waitUntil: "networkidle" });
  record("results without answers shows no result", await page.getByRole("heading", { name: "There are no next steps to show" }).isVisible());
  await context.close();

  // Desktop and tablet layouts of a question screen.
  for (const [width, height] of [
    [1280, 900],
    [768, 1024],
  ]) {
    const wide = await newContext(browser, { viewport: { width, height } });
    const desk = await wide.newPage();
    await desk.goto(base + "/concern", { waitUntil: "networkidle" });
    await desk.getByRole("button", { name: "I agree and start" }).click();
    await desk.getByRole("heading", { level: 1, name: "What brings you here today?" }).waitFor();
    await desk.getByText("Fluid is coming from my nipple", { exact: true }).click();
    const o = await overflow(desk);
    record(`question screen has no overflow @${width}x${height}`, o.scroll <= o.width, o.offenders.join(", "));
    await desk.screenshot({ path: `${outDir}/${width}x${height}_triage-q1.png`, fullPage: true, timeout: 120000 });
    await wide.close();
  }
}
