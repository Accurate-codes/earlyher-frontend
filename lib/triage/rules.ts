import type { Branch, MultiQuestionId, OptionOf, QuestionId, SingleQuestionId, TriageAnswers } from "./questions";

/**
 * Deterministic urgency rules for the breast-concern triage.
 *
 * WORKING SPECIFICATION, NOT CLINICALLY VALIDATED. Every choice the supplied
 * specification did not settle is isolated in TRIAGE_POLICY or marked with a
 * `provisional` clinical-review id (see docs/clinical-review.md). Nothing here is
 * decided by AI, and urgency is always recomputed from the current applicable
 * answers: no counters are kept between screens.
 *
 * Levels: 1 Green (routine), 2 Yellow (within 4 weeks), 3 Orange (within 1 week),
 * 4 Red (today, within 24 hours).
 */

export type Level = 1 | 2 | 3 | 4;
export const GREEN: Level = 1;
export const YELLOW: Level = 2;
export const ORANGE: Level = 3;
export const RED: Level = 4;

/** What the person is shown. "review" is the review-safe fallback for unresolved paths. */
export type Outcome = "red" | "orange" | "yellow" | "green" | "review";

export const TRIAGE_POLICY = {
  version: "triage-working-spec-2026-10",
  review: {
    status: "draft" as const,
    note: "Working implementation specification. Requires clinical validation before live use.",
  },
  /**
   * CR-4: the specification does not say whether one isolated Yellow flag, with no
   * other finding, establishes Yellow. Until decided, such a result is shown as the
   * review-safe fallback (speak with a health professional, no timeframe).
   * Set to "yellow" once the clinical lead confirms that a single flag means Yellow.
   */
  singleYellowFlag: "review-fallback" as "review-fallback" | "yellow",
  /**
   * CR-8: H5 "It needed a follow-up" is record-only in the supplied rules and no
   * follow-up policy exists. Rather than presenting a confident routine result, an
   * otherwise-Green result is shown as the review-safe fallback.
   */
  priorScanFollowUpAtGreen: "review-fallback" as "review-fallback" | "record-only",
};

export type FlagKey = "R4" | "A5" | "A6" | "A7" | "A8" | "A9" | "B1" | "B4";

export type ReasonKey =
  | "inflamedFever"
  | "inflamed"
  | "nippleInflamedFever"
  | "nippleInflamed"
  | "pregnantLump"
  | "bodyChanges"
  | "bodyChangesLump"
  | "armpitLump"
  | "lumpWeeks"
  | "lumpChanged"
  | "lumpCyclic"
  | "lumpNotCyclic"
  | "lumpCycleUnsure"
  | "lumpHard"
  | "lumpFirm"
  | "lumpFeelUnsure"
  | "lumpEdges"
  | "lumpEdgesUnsure"
  | "lumpFixed"
  | "lumpMoveUnsure"
  | "lumpPastUnknown"
  | "fluidOwn"
  | "fluidOneOpening"
  | "fluidBloody"
  | "fluidClearOwn"
  | "fluidMilky"
  | "fluidThick"
  | "fluidCheck"
  | "fluidWithOther"
  | "fluidHormone"
  | "painStrong"
  | "painLasting"
  | "painSpotLasting"
  | "skinDimpling"
  | "skinOrangePeel"
  | "skinRedness"
  | "skinSwelling"
  | "skinWarm"
  | "nippleInversion"
  | "nippleScaly"
  | "nippleScalyClears"
  | "changeWorse"
  | "severalSigns"
  | "historyPlus"
  | "historyGreen"
  | "injuryPain"
  | "noWarningSigns"
  | "selfCheckNormal"
  | "priorScanFollowUp";

export type AdviceKey =
  | "recheckAfterPeriod"
  | "hormoneCheck"
  | "bringMedicines"
  | "mammogram"
  | "screening"
  | "routineCheck"
  | "monthlySelfCheck";

/** Clinical-review items (docs/clinical-review.md) attached to provisional rules. */
export type ReviewItem = "CR-1" | "CR-2" | "CR-3" | "CR-4" | "CR-5" | "CR-6" | "CR-7" | "CR-8";

export type FindingEffect = { kind: "minimum"; level: 2 | 3 | 4 } | { kind: "flag"; flag: FlagKey };

export interface Finding {
  /** Stable rule id, for tests and the clinical-review document. Never shown to users. */
  rule: string;
  source: QuestionId;
  effect: FindingEffect;
  reason: ReasonKey;
  provisional?: ReviewItem;
  /** Set when a documented exception switched this finding off. Suppressed findings never affect urgency. */
  suppressedBy?: "injury-exception" | "D4-longstanding";
}

export interface Evaluation {
  level: Level;
  outcome: Outcome;
  /** Every finding, including suppressed ones (for transparency in tests). */
  findings: Finding[];
  /** Distinct Yellow flags from active findings. */
  flags: FlagKey[];
  historyRisk: boolean;
  /** Plain-language reasons, most important first, without duplicates. */
  reasons: ReasonKey[];
  advice: AdviceKey[];
  /** Unresolved specification paths that led to the review-safe fallback. */
  unresolved: ("single-yellow-flag" | "prior-scan-follow-up")[];
  branches: Branch[];
  context: {
    fever: boolean;
    injuryException: boolean;
    spontaneous: boolean | "unknown" | null;
  };
}

// --- Typed answer helpers --------------------------------------------------------------

function is<Q extends SingleQuestionId>(answers: TriageAnswers, id: Q, ...values: OptionOf<Q>[]): boolean {
  const value = answers[id] as string | undefined;
  return value !== undefined && (values as string[]).includes(value);
}

function has<Q extends MultiQuestionId>(answers: TriageAnswers, id: Q, ...values: OptionOf<Q>[]): boolean {
  const value = answers[id] as string[] | undefined;
  return value !== undefined && value.some((option) => (values as string[]).includes(option));
}

/** Symptom branches disclosed by the current answers, in the fixed A–D order. */
export function activeBranches(answers: TriageAnswers): Branch[] {
  const set = new Set<Branch>();
  for (const option of answers.Q1 ?? []) if (option !== "N") set.add(option);
  if (is(answers, "N2", "change", "unsure")) set.add("D");
  if (is(answers, "N3", "something", "unsure")) set.add("A");
  if (is(answers, "B5", "yes")) {
    set.add("A");
    set.add("D");
  }
  for (const option of answers.C7 ?? []) if (option !== "none") set.add(option);
  for (const option of answers.D6 ?? []) if (option !== "none") set.add(option);
  return (["A", "B", "C", "D"] as const).filter((branch) => set.has(branch));
}

export function isAge40Plus(answers: TriageAnswers): boolean {
  return is(answers, "Q1b", "40to49", "50to69", "70plus");
}

function weight(finding: Finding): number {
  return finding.effect.kind === "minimum" ? finding.effect.level : 1.5;
}

/**
 * Evaluates the current applicable answers. Pass only answers that are still on the
 * person's path (flow.ts does this), so hidden stale answers can never influence it.
 */
export function evaluate(answers: TriageAnswers): Evaluation {
  const findings: Finding[] = [];
  const add = (finding: Finding) => findings.push(finding);
  const minimum = (level: 2 | 3 | 4): FindingEffect => ({ kind: "minimum", level });
  const flag = (key: FlagKey): FindingEffect => ({ kind: "flag", flag: key });

  const branches = activeBranches(answers);
  const fever = is(answers, "R1", "yes", "feverish");
  const inflammationReported = is(answers, "R2", "recent", "weeks");
  const lumpReported = answers.A1 !== undefined;
  const injuryRecent = is(answers, "R5", "recent");
  // CR-3: provisional injury exception, pain-only assessments within two weeks of a knock.
  const injuryException = injuryRecent && branches.length === 1 && branches[0] === "C";

  // --- Safety screening ---------------------------------------------------------------
  if (is(answers, "R2", "recent")) {
    add(
      fever
        ? { rule: "R2.recent+fever", source: "R2", effect: minimum(4), reason: "inflamedFever" }
        : { rule: "R2.recent", source: "R2", effect: minimum(3), reason: "inflamed" },
    );
  }
  if (is(answers, "R2", "weeks")) {
    // CR-1: the broader source rule makes fever plus inflammation Red regardless of duration.
    add({
      rule: "R2.weeks",
      source: "R2",
      effect: minimum(3),
      reason: fever ? "inflamedFever" : "inflamed",
      provisional: fever ? "CR-1" : undefined,
    });
  }
  if (lumpReported && is(answers, "R3", "pregnant", "breastfeeding")) {
    add({ rule: "R3+lump", source: "R3", effect: minimum(3), reason: "pregnantLump" });
  }
  if (has(answers, "R4", "weightLoss", "bonePain", "headaches", "vision")) {
    add({ rule: "R4.any", source: "R4", effect: flag("R4"), reason: "bodyChanges" });
    if (lumpReported) add({ rule: "R4+lump", source: "R4", effect: minimum(3), reason: "bodyChangesLump" });
  }

  // --- A: lump -------------------------------------------------------------------------
  if (is(answers, "A1", "armpit")) add({ rule: "A1.armpit", source: "A1", effect: minimum(3), reason: "armpitLump" });
  if (is(answers, "A3", "gt2weeks", "gt1month")) add({ rule: "A3.long", source: "A3", effect: minimum(3), reason: "lumpWeeks" });
  if (is(answers, "A4", "bigger", "different")) add({ rule: "A4.changed", source: "A4", effect: minimum(3), reason: "lumpChanged" });
  if (is(answers, "A5", "yes") && is(answers, "A3", "lt1week", "1to2weeks")) {
    add({ rule: "A5.cyclic-recent", source: "A5", effect: minimum(2), reason: "lumpCyclic" });
  }
  if (is(answers, "A5", "no", "noPeriods")) add({ rule: "A5.not-cyclic", source: "A5", effect: minimum(3), reason: "lumpNotCyclic" });
  if (is(answers, "A5", "unsure")) add({ rule: "A5.unsure", source: "A5", effect: flag("A5"), reason: "lumpCycleUnsure" });
  if (is(answers, "A6", "hard")) add({ rule: "A6.hard", source: "A6", effect: minimum(3), reason: "lumpHard" });
  if (is(answers, "A6", "firm")) add({ rule: "A6.firm", source: "A6", effect: flag("A6"), reason: "lumpFirm" });
  if (is(answers, "A6", "unsure")) add({ rule: "A6.unsure", source: "A6", effect: flag("A6"), reason: "lumpFeelUnsure" });
  if (is(answers, "A7", "uneven")) add({ rule: "A7.uneven", source: "A7", effect: minimum(3), reason: "lumpEdges" });
  if (is(answers, "A7", "unsure")) add({ rule: "A7.unsure", source: "A7", effect: flag("A7"), reason: "lumpEdgesUnsure" });
  if (is(answers, "A8", "stuck")) add({ rule: "A8.stuck", source: "A8", effect: minimum(3), reason: "lumpFixed" });
  if (is(answers, "A8", "unsure")) add({ rule: "A8.unsure", source: "A8", effect: flag("A8"), reason: "lumpMoveUnsure" });
  if (is(answers, "A9", "unknownResult")) add({ rule: "A9.unknown", source: "A9", effect: flag("A9"), reason: "lumpPastUnknown" });

  // --- B: nipple fluid -----------------------------------------------------------------
  const spontaneous: boolean | "unknown" | null = is(answers, "B1", "yes")
    ? true
    : is(answers, "B1", "squeeze")
      ? false
      : is(answers, "B1", "unsure")
        ? "unknown"
        : null;
  const oneBreast = is(answers, "B2", "one");
  const bothBreasts = is(answers, "B2", "both");
  if (spontaneous === true) add({ rule: "B1.spontaneous", source: "B1", effect: flag("B1"), reason: "fluidOwn" });
  if ((spontaneous === true || spontaneous === "unknown") && oneBreast && is(answers, "B3", "one")) {
    // CR-2: the source overview used broader escalation criteria than this detailed rule.
    add({ rule: "B3.single-duct", source: "B3", effect: minimum(3), reason: "fluidOneOpening", provisional: "CR-2" });
  }
  if (answers.B4 !== undefined) {
    if (is(answers, "B4", "pink", "bloody")) {
      add({ rule: "B4.bloody", source: "B4", effect: minimum(3), reason: "fluidBloody" });
    } else if (is(answers, "B4", "clear") && spontaneous === true && oneBreast) {
      add({ rule: "B4.clear-spontaneous-one", source: "B4", effect: minimum(3), reason: "fluidClearOwn" });
    } else if (is(answers, "B4", "milky") && bothBreasts && is(answers, "R3", "pregnant", "breastfeeding", "stopped")) {
      // Milky fluid from both breasts during or soon after pregnancy or breastfeeding: no B4 finding.
    } else if (is(answers, "B4", "milky") && bothBreasts && spontaneous === false && is(answers, "R3", "none")) {
      add({ rule: "B4.milky-both-squeeze", source: "B4", effect: minimum(2), reason: "fluidMilky" });
    } else if (is(answers, "B4", "coloured") && is(answers, "B3", "several")) {
      add({ rule: "B4.coloured-several", source: "B4", effect: minimum(2), reason: "fluidThick" });
    } else if (is(answers, "B4", "clear") && spontaneous === false && is(answers, "B3", "several")) {
      // Clear fluid only on squeezing, from several openings: no B4 finding.
    } else {
      add({ rule: "B4.other", source: "B4", effect: flag("B4"), reason: "fluidCheck" });
    }
  }
  if (is(answers, "B5", "yes")) {
    // CR-7: one combined question adds both A and D without saying which finding it was.
    add({ rule: "B5.yes", source: "B5", effect: minimum(3), reason: "fluidWithOther", provisional: "CR-7" });
  }
  const hormone = is(answers, "B6", "yes") || (is(answers, "B6", "noPeriods") && is(answers, "B6b", "yes"));
  if (hormone) add({ rule: "B6.hormone", source: "B6", effect: minimum(3), reason: "fluidHormone" });
  if (is(answers, "B8", "yes")) {
    add(
      fever
        ? { rule: "B8.yes+fever", source: "B8", effect: minimum(4), reason: "nippleInflamedFever" }
        : { rule: "B8.yes", source: "B8", effect: minimum(3), reason: "nippleInflamed" },
    );
  }

  // --- C: pain -------------------------------------------------------------------------
  const nonCyclic = is(answers, "C1", "no", "noPeriods");
  const focal = is(answers, "C2", "oneSpot");
  const longPain = is(answers, "C4", "2to6weeks", "gt6weeks");
  const injury = injuryException ? ({ suppressedBy: "injury-exception", provisional: "CR-3" } as const) : {};
  if (nonCyclic && (is(answers, "C3", "strong") || is(answers, "C3b", "yes"))) {
    add({ rule: "C3.strong-non-cyclic", source: "C3", effect: minimum(2), reason: "painStrong", ...injury });
  }
  if (nonCyclic && longPain) {
    add({ rule: "C4.long-non-cyclic", source: "C4", effect: minimum(2), reason: "painLasting", ...injury });
  }
  if (focal && longPain) {
    add({ rule: "C4.long-focal", source: "C4", effect: minimum(2), reason: "painSpotLasting", ...injury });
  }
  if (is(answers, "C6", "yes")) {
    add(
      fever
        ? { rule: "C6.yes+fever", source: "C6", effect: minimum(4), reason: "inflamedFever" }
        : { rule: "C6.yes", source: "C6", effect: minimum(3), reason: "inflamed" },
    );
  }

  // --- D: skin and nipple changes --------------------------------------------------------
  // Redness, swelling and warmth already captured by R2 share its reason, so it is not repeated.
  const inflamedReason: ReasonKey = fever ? "inflamedFever" : "inflamed";
  const d1: [OptionOf<"D1">, ReasonKey][] = [
    ["dimpling", "skinDimpling"],
    ["orangePeel", "skinOrangePeel"],
    ["redness", inflammationReported ? inflamedReason : "skinRedness"],
    ["swelling", inflammationReported ? inflamedReason : "skinSwelling"],
    ["warm", inflammationReported ? inflamedReason : "skinWarm"],
  ];
  for (const [option, reason] of d1) {
    if (has(answers, "D1", option)) add({ rule: `D1.${option}`, source: "D1", effect: minimum(3), reason, provisional: "CR-5" });
  }
  if (has(answers, "D1", "inversion")) {
    // D4 changes only the inversion finding; every other finding stays.
    add({
      rule: "D1.inversion",
      source: "D1",
      effect: minimum(3),
      reason: "nippleInversion",
      provisional: "CR-5",
      ...(is(answers, "D4", "always") ? { suppressedBy: "D4-longstanding" as const } : {}),
    });
  }
  if (has(answers, "D1", "scaly")) {
    // D5 changes only the scaly-skin finding.
    add(
      is(answers, "D5", "clears")
        ? { rule: "D1.scaly+D5.clears", source: "D5", effect: minimum(2), reason: "nippleScalyClears", provisional: "CR-5" }
        : { rule: "D1.scaly", source: "D1", effect: minimum(3), reason: "nippleScaly", provisional: "CR-5" },
    );
  }
  if (is(answers, "D3", "yes")) add({ rule: "D3.worse", source: "D3", effect: minimum(3), reason: "changeWorse" });

  // --- Combination --------------------------------------------------------------------
  const active = findings.filter((finding) => !finding.suppressedBy);
  const flags = [...new Set(active.flatMap((f) => (f.effect.kind === "flag" ? [f.effect.flag] : [])))];
  const historyRisk = (["H1", "H2", "H3", "H4"] as const).some((id) => is(answers, id, "yes"));
  const combination: ReasonKey[] = [];

  let level: Level = active.reduce<Level>(
    (max, f) => (f.effect.kind === "minimum" && f.effect.level > max ? f.effect.level : max),
    GREEN,
  );
  if (flags.length >= 2 && level < ORANGE) {
    level = ORANGE;
    combination.push("severalSigns");
  }
  // History risk plus a Yellow finding (a direct Yellow, or a Yellow flag) gives Orange.
  if (historyRisk && level < ORANGE && (level === YELLOW || flags.length >= 1)) {
    level = ORANGE;
    combination.push("historyPlus");
  }

  const unresolved: Evaluation["unresolved"] = [];
  let outcome: Outcome = level === RED ? "red" : level === ORANGE ? "orange" : level === YELLOW ? "yellow" : "green";
  if (level === GREEN && flags.length === 1) {
    if (TRIAGE_POLICY.singleYellowFlag === "yellow") {
      level = YELLOW;
      outcome = "yellow";
    } else {
      unresolved.push("single-yellow-flag");
      outcome = "review";
    }
  }
  if (outcome === "green" && is(answers, "H5", "followUp") && TRIAGE_POLICY.priorScanFollowUpAtGreen === "review-fallback") {
    unresolved.push("prior-scan-follow-up");
    outcome = "review";
  }

  // --- Reasons ------------------------------------------------------------------------
  const ordered = [...active].sort((a, b) => weight(b) - weight(a));
  const reasons: ReasonKey[] = [];
  const push = (reason: ReasonKey) => {
    if (!reasons.includes(reason)) reasons.push(reason);
  };
  for (const finding of ordered.filter((f) => weight(f) === RED)) push(finding.reason);
  for (const reason of combination) push(reason);
  for (const finding of ordered) push(finding.reason);
  if (unresolved.includes("prior-scan-follow-up")) push("priorScanFollowUp");
  if (outcome === "green") {
    if (findings.some((f) => f.suppressedBy === "injury-exception")) push("injuryPain");
    else if (branches.length === 0 && answers.Q1?.includes("N")) push("selfCheckNormal");
    else push("noWarningSigns");
    if (historyRisk) push("historyGreen");
  }

  // --- Advice -------------------------------------------------------------------------
  const advice: AdviceKey[] = [];
  if (active.some((f) => f.rule === "A5.cyclic-recent")) advice.push("recheckAfterPeriod");
  if (hormone) advice.push("hormoneCheck");
  if (answers.B7 !== undefined) advice.push("bringMedicines");
  if (outcome === "green") {
    if (historyRisk) advice.push("screening");
    if (is(answers, "N4", "over2years", "never", "dontRemember")) advice.push("routineCheck");
    if (isAge40Plus(answers)) advice.push("mammogram");
    if (is(answers, "N1", "sometimes", "never")) advice.push("monthlySelfCheck");
  }

  return {
    level,
    outcome,
    findings,
    flags,
    historyRisk,
    reasons,
    advice,
    unresolved,
    branches,
    context: { fever, injuryException, spontaneous },
  };
}

/** Timeframe for each outcome, used for booking windows and recheck reminders. */
export const OUTCOME_WINDOW_DAYS: Record<Outcome, number | null> = {
  red: 1,
  orange: 7,
  yellow: 28,
  green: null,
  review: null,
};
