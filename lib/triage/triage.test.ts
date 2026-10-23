import { describe, expect, it } from "vitest";
import { triageText } from "@/content/en/triage";
import {
  acceptConsent,
  advance,
  buildPath,
  continueAfterRed,
  createTriage,
  goBack,
  insertAfterCurrent,
  pruneAnswers,
  resolveCursor,
  setAnswer,
  switchEntry,
  type Entry,
  type TriageState,
} from "./flow";
import type { QuestionId, TriageAnswers } from "./questions";
import { evaluate } from "./rules";
import { buildSummary } from "./summary";

type Answers = Record<string, string | string[]>;

const safetyClear: Answers = { Q1b: "25to39", R1: "no", R2: "no", R3: "none", R4: ["none"], R5: "no" };
const historyClear: Answers = { H1: "no", H2: "no", H3: "no", H4: "no", H5: "never" };
/** A recent lump that changes with periods: minimum Yellow, no flags. */
const lumpRecentCyclic: Answers = {
  A1: "right",
  A2R: "upperOuter",
  A3: "lt1week",
  A5: "yes",
  A6: "soft",
  A7: "smooth",
  A8: "moves",
  A9: "no",
};
/** Mild pain with periods, nothing else: no findings. */
const painMildCyclic: Answers = { C1: "yes", C2: "both", C3: "mild", C3b: "no", C4: "lt2weeks", C5: "no", C6: "no", C7: ["none"] };

const path = (answers: Answers, entry: Entry = "concern", continuedFrom: QuestionId | null = null) =>
  buildPath({ entry, answers: answers as TriageAnswers, continuedFrom });
const evaluateAnswers = (answers: Answers, entry: Entry = "concern") => evaluate(path(answers, entry).answers);

/** Walks the journey screen by screen as a person would, answering from `answers`. */
function walk(entry: Entry, answers: Answers): TriageState {
  let state = acceptConsent(createTriage(entry), new Date("2026-10-23T10:00:00Z"));
  for (let guard = 0; guard < 80; guard += 1) {
    const cursor = resolveCursor(state);
    if (cursor === "result" || cursor === "deferred" || cursor === "welcome") return state;
    const current = buildPath(state);
    const screenAnswers = Object.entries(answers).filter(([id]) => id === cursor || id.startsWith(cursor));
    for (const [id, value] of screenAnswers) state = setAnswer(state, id as QuestionId, value);
    const next = advance(state, cursor);
    if (!next) throw new Error(`Stuck at ${cursor} (path: ${current.screens.join(",")})`);
    state = next;
  }
  throw new Error("Journey did not finish");
}

describe("journeys and branching", () => {
  it("asks safety questions before the symptom branches, in A, B, C, D order", () => {
    const p = path({ Q1: ["C", "A"], ...safetyClear });
    expect(p.screens.slice(0, 7)).toEqual(["Q1", "Q1b", "R1", "R2", "R3", "R4", "R5"]);
    expect(p.queue).toEqual(["A", "C"]);
    expect(p.screens.at(-1)).toBe("A1");
  });

  it("starts the no-concern journey at age, without the symptom question", () => {
    const p = path({}, "no-concern");
    expect(p.screens).toEqual(["Q1b"]);
    expect(p.answers.Q1).toEqual(["N"]);
  });

  it("finishes the self-check with a routine result and no safety questions", () => {
    const p = path({ Q1b: "50to69", N1: "never", N2: "normal", N3: "normal", N4: "never" }, "no-concern");
    expect(p.screens).toEqual(["Q1b", "N1", "N2", "N3", "N4"]);
    expect(p.end).toBe("result");
    const result = evaluate(p.answers);
    expect(result.outcome).toBe("green");
    expect(result.reasons).toContain("selfCheckNormal");
    expect(result.advice).toEqual(["routineCheck", "mammogram", "monthlySelfCheck"]);
  });

  it("moves a seen change into the skin branch through safety screening, skipping the remaining self-check", () => {
    for (const seen of ["change", "unsure"]) {
      const p = path({ Q1b: "25to39", N1: "monthly", N2: seen, N3: "normal", N4: "never", ...safetyClear }, "no-concern");
      expect(p.screens).toEqual(["Q1b", "N1", "N2", "R1", "R2", "R3", "R4", "R5", "D1"]);
      expect(p.queue).toEqual(["D"]);
      expect(p.answers.N3).toBeUndefined();
      expect(p.answers.Q1b).toBe("25to39");
    }
  });

  it("moves a felt lump into the lump branch through safety screening", () => {
    for (const felt of ["something", "unsure"]) {
      const p = path({ Q1b: "25to39", N1: "monthly", N2: "normal", N3: felt, ...safetyClear }, "no-concern");
      expect(p.screens.slice(3)).toEqual(["N3", "R1", "R2", "R3", "R4", "R5", "A1"]);
      expect(p.queue).toEqual(["A"]);
    }
  });

  it("ends a deferred self-check without a result", () => {
    const p = path({ Q1b: "25to39", N1: "monthly", N2: "normal", N3: "later" }, "no-concern");
    expect(p.end).toBe("deferred");
  });

  it("walks a whole concern journey and reaches the result", () => {
    const state = walk("concern", { Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, ...historyClear });
    expect(state.cursor).toBe("result");
    expect(evaluate(buildPath(state).answers).outcome).toBe("yellow");
  });

  it("switches journeys while keeping consent and age", () => {
    const state = walk("no-concern", { Q1b: "40to49", N1: "monthly", N2: "normal", N3: "normal", N4: "lastYear" });
    const switched = switchEntry(state, "concern");
    expect(switched.consent).toEqual(state.consent);
    expect(switched.answers).toEqual({ Q1b: "40to49" });
    expect(switched.cursor).toBe("Q1");
  });
});

describe("branch queue", () => {
  it("adds disclosed branches after the current one, without duplicates", () => {
    expect(insertAfterCurrent(["B", "C"], 0, ["D", "A"])).toEqual(["B", "A", "D", "C"]);
    expect(insertAfterCurrent(["A", "C", "D"], 1, ["A", "D", "B"])).toEqual(["A", "C", "B", "D"]);
  });

  it("asks a branch disclosed by B5 straight after the fluid questions", () => {
    const fluid = { B1: "squeeze", B2: "both", B3: "several", B4: "clear", B5: "yes", B6: "no", B7: ["none"], B8: "no" };
    const p = path({ Q1: ["B", "C"], ...safetyClear, ...fluid, ...lumpRecentCyclic });
    expect(p.queue).toEqual(["B", "A", "D", "C"]);
    expect(p.screens.at(-1)).toBe("D1");
  });

  it("never repeats a completed branch or loops when branches disclose each other", () => {
    const skin = { D1: ["dimpling"], D2: "lt1week", D3: "no", D6: ["A"] };
    const p = path({
      Q1: ["A", "C"],
      ...safetyClear,
      ...lumpRecentCyclic,
      ...painMildCyclic,
      C7: ["A", "D"],
      ...skin,
      H5: "never",
    });
    expect(p.queue).toEqual(["A", "C", "D"]);
    expect(p.screens.filter((s) => s === "A1")).toHaveLength(1);
    expect(p.end).toBe("result");
  });
});

describe("early Red result", () => {
  const red = { Q1: ["C"], Q1b: "25to39", R1: "yes", R2: "recent" };

  it("stops the questions and marks the assessment incomplete", () => {
    const p = path(red);
    expect(p.end).toBe("red-exit");
    expect(p.redExitAt).toBe("R2");
    expect(evaluate(p.answers).outcome).toBe("red");
  });

  it("feeling feverish counts as fever", () => {
    expect(evaluateAnswers({ ...red, R1: "feverish" }).outcome).toBe("red");
    expect(evaluateAnswers({ ...red, R1: "no" }).outcome).toBe("orange");
  });

  it("can continue at R3 and stays Red, then completes", () => {
    let state = walk("concern", red);
    expect(state.cursor).toBe("result");
    state = continueAfterRed(state);
    expect(state.cursor).toBe("R3");
    const finished = walk("concern", { ...red, R3: "none", R4: ["none"], R5: "no", ...painMildCyclic, H5: "never" });
    const continued = continueAfterRed(finished);
    let s = continued;
    for (const [id, value] of Object.entries({ R3: "none", R4: ["none"], R5: "no", ...painMildCyclic, H5: "never" })) {
      s = setAnswer(s, id as QuestionId, value);
    }
    const p = buildPath(s);
    expect(p.end).toBe("result");
    expect(p.notAsked).toContain("C6");
    expect(p.notAsked).toEqual(expect.arrayContaining(["H1", "H2", "H3", "H4"]));
    expect(evaluate(p.answers).outcome).toBe("red");
  });

  it("does not move into Red when the inflammation has lasted weeks (detailed rule, under review)", () => {
    const result = evaluateAnswers({ ...red, R2: "weeks" });
    expect(result.outcome).toBe("orange");
    expect(result.findings.find((f) => f.rule === "R2.weeks")?.provisional).toBe("CR-1");
  });

  it("treats a red, hot nipple with fever (B8) as Red", () => {
    const fluid = { B1: "squeeze", B2: "both", B3: "several", B4: "clear", B5: "no", B6: "no", B7: ["none"], B8: "yes" };
    const p = path({ Q1: ["B"], ...safetyClear, R1: "yes", ...fluid });
    expect(p.end).toBe("red-exit");
    expect(p.redExitAt).toBe("B8");
  });
});

describe("changing earlier answers", () => {
  it("removes answers that no longer apply and rebuilds the path", () => {
    let state = walk("concern", {
      Q1: ["A"],
      ...safetyClear,
      ...lumpRecentCyclic,
      A3: "gt2weeks",
      A4: "bigger",
      H5: "never",
    });
    expect(buildPath(state).answers.A4).toBe("bigger");
    expect(evaluate(buildPath(state).answers).outcome).toBe("orange");

    state = { ...state, cursor: "A3" };
    state = setAnswer(state, "A3", "lt1week");
    state = advance(state, "A3")!;
    expect(state.answers.A4).toBeUndefined();
    const p = buildPath(state);
    expect(p.notAsked).toContain("A4");
    // Back to Yellow, so the history questions now apply and are asked.
    expect(p.end).toBeNull();
    expect(p.screens.at(-1)).toBe("H1");
    expect(state.cursor).toBe("A5");
  });

  it("drops a whole branch when its symptom is deselected", () => {
    let state = walk("concern", { Q1: ["A", "C"], ...safetyClear, ...lumpRecentCyclic, ...painMildCyclic, ...historyClear });
    state = { ...state, cursor: "Q1" };
    state = setAnswer(state, "Q1", ["C"]);
    state = advance(state, "Q1")!;
    expect(Object.keys(state.answers).some((id) => id.startsWith("A"))).toBe(false);
    expect(state.answers.C1).toBe("yes");
  });

  it("keeps later answers while an earlier screen is temporarily incomplete", () => {
    const state = walk("concern", { Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, ...historyClear });
    const edited = setAnswer({ ...state, cursor: "Q1" }, "Q1", []);
    expect(edited.answers.A1).toBe("right");
    expect(advance(edited, "Q1")).toBeNull();
  });

  it("hidden stale answers never influence the result", () => {
    const answers = { Q1: ["C"], ...safetyClear, ...painMildCyclic, ...historyClear, A6: "hard", A1: "armpit" };
    expect(evaluateAnswers(answers).outcome).toBe("green");
    expect(pruneAnswers({ entry: "concern", answers: answers as TriageAnswers, continuedFrom: null }).A6).toBeUndefined();
  });

  it("goes back screen by screen with answers kept", () => {
    const state = walk("concern", { Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, ...historyClear });
    const back = goBack(state);
    expect(back.cursor).toBe("H5");
    expect(goBack(back).cursor).toBe("H4");
    expect(back.answers.H5).toBe("never");
  });

  it("ignores a second, duplicate move from the same screen", () => {
    let state = acceptConsent(createTriage("concern"), new Date());
    state = setAnswer(state, "Q1", ["A"]);
    const moved = advance(state, "Q1")!;
    expect(moved.cursor).toBe("Q1b");
    expect(advance(moved, "Q1")).toBeNull();
  });
});

describe("Yellow flags and combinations", () => {
  it("counts each flag once however many answers raise it", () => {
    const result = evaluateAnswers({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, A6: "firm" });
    expect(result.flags).toEqual(["A6"]);
    expect(evaluate(path({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, A6: "firm" }).answers)).toEqual(result);
  });

  it("two distinct flags give at least Orange", () => {
    const result = evaluateAnswers({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, A7: "unsure", A8: "unsure" });
    expect(result.flags).toEqual(["A7", "A8"]);
    expect(result.outcome).toBe("orange");
    expect(result.reasons[0]).toBe("severalSigns");
  });

  it("distinguishes a minimum Yellow from a Yellow flag", () => {
    const direct = evaluateAnswers({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, ...historyClear });
    expect(direct.outcome).toBe("yellow");
    expect(direct.flags).toEqual([]);
    expect(direct.advice).toContain("recheckAfterPeriod");
  });

  it("shows the review-safe fallback for a single isolated flag", () => {
    const result = evaluateAnswers({ Q1: ["C"], ...safetyClear, R4: ["headaches"], ...painMildCyclic, ...historyClear });
    expect(result.flags).toEqual(["R4"]);
    expect(result.outcome).toBe("review");
    expect(result.unresolved).toEqual(["single-yellow-flag"]);
  });

  it("history risk plus Yellow gives Orange; plus Green stays Green with screening advice", () => {
    expect(evaluateAnswers({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, ...historyClear, H2: "yes" }).outcome).toBe("orange");
    expect(
      evaluateAnswers({ Q1: ["C"], ...safetyClear, R4: ["vision"], ...painMildCyclic, ...historyClear, H1: "yes" }).outcome,
    ).toBe("orange");
    const green = evaluateAnswers({ Q1: ["C"], ...safetyClear, Q1b: "40to49", ...painMildCyclic, ...historyClear, H3: "yes" });
    expect(green.outcome).toBe("green");
    expect(green.advice).toEqual(["screening", "mammogram"]);
    expect(green.reasons).toContain("historyGreen");
  });

  it("does not add age advice outside a routine result, and age never changes urgency", () => {
    const young = evaluateAnswers({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, ...historyClear });
    const older = evaluateAnswers({ Q1: ["A"], ...safetyClear, Q1b: "70plus", ...lumpRecentCyclic, ...historyClear });
    expect(older.level).toBe(young.level);
    expect(older.advice).not.toContain("mammogram");
  });

  it("the highest urgency wins, and reassuring answers do not remove other findings", () => {
    const result = evaluateAnswers({ Q1: ["A", "C"], ...safetyClear, ...lumpRecentCyclic, A6: "hard", ...painMildCyclic, H5: "never" });
    expect(result.outcome).toBe("orange");
    expect(result.reasons).toContain("lumpHard");
  });

  it("an R4 change plus a lump is Orange, even when the lump branch is added later", () => {
    const fluid = { B1: "squeeze", B2: "both", B3: "several", B4: "clear", B5: "yes", B6: "no", B7: ["none"], B8: "no" };
    const result = evaluateAnswers({ Q1: ["B"], ...safetyClear, R4: ["bonePain"], ...fluid, ...lumpRecentCyclic });
    expect(result.findings.some((f) => f.rule === "R4+lump")).toBe(true);
  });
});

describe("pregnancy, breastfeeding and lumps", () => {
  it("pregnant or breastfeeding with a lump is at least Orange", () => {
    for (const r3 of ["pregnant", "breastfeeding"]) {
      expect(evaluateAnswers({ Q1: ["A"], ...safetyClear, R3: r3, ...lumpRecentCyclic, ...historyClear }).outcome).toBe("orange");
    }
    expect(evaluateAnswers({ Q1: ["A"], ...safetyClear, R3: "stopped", ...lumpRecentCyclic, ...historyClear }).outcome).toBe("yellow");
  });
});

describe("nipple fluid", () => {
  const fluid = (overrides: Answers) =>
    evaluateAnswers({
      Q1: ["B"],
      ...safetyClear,
      B1: "squeeze",
      B2: "both",
      B3: "several",
      B4: "clear",
      B5: "no",
      B6: "no",
      B7: ["none"],
      B8: "no",
      ...historyClear,
      ...overrides,
    });

  it("spontaneous or unknown, one breast, one opening is Orange", () => {
    expect(fluid({ B1: "yes", B2: "one", B2side: "left", B3: "one" }).outcome).toBe("orange");
    expect(fluid({ B1: "unsure", B2: "one", B2side: "left", B3: "one" }).outcome).toBe("orange");
    expect(fluid({ B1: "squeeze", B2: "one", B2side: "left", B3: "one" }).outcome).not.toBe("orange");
  });

  it("pink or bloody is Orange", () => {
    expect(fluid({ B4: "pink" }).outcome).toBe("orange");
    expect(fluid({ B4: "bloody" }).reasons).toContain("fluidBloody");
  });

  it("clear and definitely spontaneous from one breast is Orange; unknown is not", () => {
    expect(fluid({ B1: "yes", B2: "one", B2side: "right", B3: "several", B4: "clear" }).findings.map((f) => f.rule)).toContain(
      "B4.clear-spontaneous-one",
    );
    expect(fluid({ B1: "unsure", B2: "one", B2side: "right", B3: "several", B4: "clear" }).findings.map((f) => f.rule)).toContain(
      "B4.other",
    );
  });

  it("milky from both breasts on squeezing is Yellow, and has no B4 finding during or after breastfeeding", () => {
    expect(fluid({ B4: "milky" }).outcome).toBe("yellow");
    for (const r3 of ["pregnant", "breastfeeding", "stopped"]) {
      const result = fluid({ B4: "milky", R3: r3 });
      expect(result.findings.filter((f) => f.source === "B4")).toEqual([]);
      expect(result.outcome).toBe("green");
    }
  });

  it("thick or coloured from several openings is Yellow; clear on squeezing from several is no finding", () => {
    expect(fluid({ B4: "coloured" }).outcome).toBe("yellow");
    expect(fluid({ B4: "clear" }).findings).toEqual([]);
  });

  it("other combinations add one flag, and uncertainty is preserved", () => {
    const result = fluid({ B3: "cantTell", B4: "coloured" });
    expect(result.flags).toEqual(["B4"]);
    expect(result.outcome).toBe("review");
    const spontaneous = fluid({ B1: "yes", B3: "cantTell", B4: "coloured" });
    expect(spontaneous.flags).toEqual(["B1", "B4"]);
    expect(spontaneous.outcome).toBe("orange");
  });

  it("B6 symptoms are Orange with a hormone-check note; B7 never lowers urgency", () => {
    const hormone = fluid({ B6: "noPeriods", B6b: "yes" });
    expect(hormone.outcome).toBe("orange");
    expect(hormone.advice).toContain("hormoneCheck");
    expect(fluid({ B4: "pink", B7: ["antipsychotics"] }).outcome).toBe("orange");
    expect(fluid({}).advice).toContain("bringMedicines");
  });

  it("asks which breast only for one breast, on the same screen", () => {
    const p = path({ Q1: ["B"], ...safetyClear, B1: "yes", B2: "one" });
    expect(p.screens.at(-1)).toBe("B2");
    expect(p.end).toBeNull();
  });

  it("skips B8 when the safety check already found redness", () => {
    const p = path({ Q1: ["B"], ...safetyClear, R2: "weeks", B1: "squeeze", B2: "both", B3: "several", B4: "clear", B5: "no", B6: "no", B7: ["none"], H5: "never" });
    expect(p.notAsked).toContain("B8");
    expect(p.end).toBe("result");
  });
});

describe("pain", () => {
  it("non-cyclic strong or disruptive pain is Yellow, and long focal pain even when cyclic", () => {
    expect(evaluateAnswers({ Q1: ["C"], ...safetyClear, ...painMildCyclic, C1: "no", C3: "strong", ...historyClear }).outcome).toBe("yellow");
    expect(evaluateAnswers({ Q1: ["C"], ...safetyClear, ...painMildCyclic, C1: "no", C3b: "yes", ...historyClear }).outcome).toBe("yellow");
    expect(evaluateAnswers({ Q1: ["C"], ...safetyClear, ...painMildCyclic, C2: "oneSpot", C4: "gt6weeks", ...historyClear }).outcome).toBe(
      "yellow",
    );
    expect(evaluateAnswers({ Q1: ["C"], ...safetyClear, ...painMildCyclic, C3: "strong", ...historyClear }).outcome).toBe("green");
  });

  it("applies the injury exception only while pain is the only symptom", () => {
    const pain = { Q1: ["C"], ...safetyClear, R5: "recent", ...painMildCyclic, C1: "no", C3: "strong", ...historyClear };
    const result = evaluateAnswers(pain);
    expect(result.outcome).toBe("green");
    expect(result.reasons).toContain("injuryPain");
    expect(result.findings.every((f) => f.suppressedBy === "injury-exception")).toBe(true);

    const withLump = evaluateAnswers({ ...pain, C7: ["A"], ...lumpRecentCyclic });
    expect(withLump.context.injuryException).toBe(false);
    expect(withLump.findings.some((f) => f.rule === "C3.strong-non-cyclic" && !f.suppressedBy)).toBe(true);
  });

  it("injury exception does not hide other concerning findings", () => {
    const result = evaluateAnswers({ Q1: ["C"], ...safetyClear, R5: "recent", ...painMildCyclic, C6: "yes", H5: "never" });
    expect(result.outcome).toBe("orange");
  });
});

describe("skin and nipple changes", () => {
  const skin = (d1: string[], extra: Answers = {}) =>
    evaluateAnswers({ Q1: ["D"], ...safetyClear, D1: d1, D2: "gt4weeks", D3: "no", D6: ["none"], ...historyClear, ...extra });

  it("a long-standing inverted nipple removes only that finding", () => {
    expect(skin(["inversion"], { D4: "always" }).outcome).toBe("green");
    expect(skin(["inversion"], { D4: "new" }).outcome).toBe("orange");
    const both = skin(["inversion", "dimpling"], { D4: "always", H5: "never" });
    expect(both.outcome).toBe("orange");
    expect(both.reasons).toEqual(["skinDimpling"]);
  });

  it("scaly skin that clears with cream elsewhere becomes Yellow, without touching other findings", () => {
    expect(skin(["scaly"], { D5: "clears" }).outcome).toBe("yellow");
    expect(skin(["scaly"], { D5: "doesNotClear", H5: "never" }).outcome).toBe("orange");
    expect(skin(["scaly", "orangePeel"], { D5: "clears", H5: "never" }).outcome).toBe("orange");
  });

  it("asks D4 and D5 only for their own changes", () => {
    const p = path({ Q1: ["D"], ...safetyClear, D1: ["scaly"], D2: "lt1week", D3: "no" });
    expect(p.screens.at(-1)).toBe("D5");
    expect(p.notAsked).toContain("D4");
  });

  it("does not repeat redness already captured in the safety check", () => {
    const result = evaluateAnswers({ Q1: ["D"], ...safetyClear, R2: "weeks", D1: ["redness", "warm"], D2: "lt1week", D3: "no", D6: ["none"], H5: "never" });
    expect(result.reasons).toEqual(["inflamed"]);
  });

  it("goes straight to D6 when no change is chosen", () => {
    const p = path({ Q1: ["D"], ...safetyClear, D1: ["none"] });
    expect(p.screens.at(-1)).toBe("D6");
  });
});

describe("history questions", () => {
  it("skips H1–H4 when the result is already Orange, but asks H5", () => {
    const p = path({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, A6: "hard" });
    expect(p.screens.at(-1)).toBe("H5");
    expect(p.notAsked).toEqual(expect.arrayContaining(["H1", "H2", "H3", "H4"]));
  });

  it("asks all history questions otherwise, with the optional age follow-up", () => {
    const p = path({ Q1: ["A"], ...safetyClear, ...lumpRecentCyclic, H1: "yes" });
    expect(p.screens.at(-1)).toBe("H2");
  });

  it("does not present a routine result when the last scan needed a follow-up", () => {
    const result = evaluateAnswers({ Q1: ["C"], ...safetyClear, ...painMildCyclic, ...historyClear, H5: "followUp" });
    expect(result.outcome).toBe("review");
    expect(result.unresolved).toEqual(["prior-scan-follow-up"]);
  });
});

describe("doctor summary", () => {
  it("lists only applicable answers, keeps uncertainty and ranges, and explains skipped questions", () => {
    const p = path({
      Q1: ["A"],
      ...safetyClear,
      ...lumpRecentCyclic,
      A6: "unsure",
      B1: "yes",
      ...historyClear,
    });
    const summary = buildSummary(p, evaluate(p.answers), triageText);
    const lump = summary.sections.find((s) => s.id === "lump")!;
    expect(lump.rows.find((r) => r.question === "A3")?.value).toBe("Less than 1 week ago");
    expect(lump.rows.find((r) => r.question === "A6")?.value).toBe("I'm not sure");
    expect(lump.rows.find((r) => r.question === "A4")).toMatchObject({ notAsked: true });
    expect(summary.sections.some((s) => s.id === "fluid")).toBe(false);
    // A recent cyclic lump is a direct Yellow; the "not sure" flag on top keeps it Yellow.
    expect(summary.outcome).toBe("yellow");
    expect(summary.incomplete).toBe(false);
  });

  it("marks an early Red result as incomplete", () => {
    const p = path({ Q1: ["C"], Q1b: "25to39", R1: "yes", R2: "recent" });
    const summary = buildSummary(p, evaluate(p.answers), triageText);
    expect(summary.incomplete).toBe(true);
    expect(summary.headline).toBe("Get seen today");
    expect(summary.reasons[0]).toMatch(/fever/);
  });
});

describe("wording", () => {
  it("has text for every option and reason, and keeps internal terms off user screens", () => {
    // Question options are excluded: "Green, yellow, brown" is a fluid colour there.
    const all = JSON.stringify({ ...triageText, questions: null });
    expect(all).not.toMatch(/\b(Yellow|Orange|Green|flag|flags|CR-\d)\b|\b[ABCDHNR]\d\.[a-z]/);
    expect(triageText.results.outcomes.green.headline).not.toMatch(/cancer/i);
    expect(triageText.welcome.concernTitle).not.toMatch(/cancer/i);
  });
});
