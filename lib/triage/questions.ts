/**
 * Structure of every triage question: stable ids, stages, answer types and option ids.
 * Wording lives in content/en/triage.ts (keyed by these ids); branching lives in
 * flow.ts; urgency rules live in rules.ts. Nothing here decides urgency.
 *
 * A "screen" is one primary question plus any short follow-ups shown on the same
 * screen (B2 side, B6b, C3b, H1b). Follow-ups name their parent screen.
 */

export type Stage = "about" | "safety" | "symptom" | "history";
export type Branch = "A" | "B" | "C" | "D";
export const BRANCH_ORDER: readonly Branch[] = ["A", "B", "C", "D"];

interface QuestionShape {
  stage: Stage;
  kind: "single" | "multi";
  options: readonly string[];
  /** Multi-select options that clear every other selection (None of these, no concern). */
  exclusive?: readonly string[];
  /** For a follow-up: the screen it is shown on. */
  parent?: string;
  /** Follow-ups that may be left blank. */
  optional?: boolean;
}

const YES_NO = ["yes", "no"] as const;
const YES_NO_UNKNOWN = ["yes", "no", "unknown"] as const;

export const QUESTIONS = {
  // --- Entry -------------------------------------------------------------------
  Q1: { stage: "about", kind: "multi", options: ["A", "B", "C", "D", "N"], exclusive: ["N"] },
  Q1b: { stage: "about", kind: "single", options: ["under25", "25to39", "40to49", "50to69", "70plus"] },

  // --- No concern / self-check --------------------------------------------------
  N1: { stage: "about", kind: "single", options: ["monthly", "sometimes", "never"] },
  N2: { stage: "about", kind: "single", options: ["normal", "change", "unsure"] },
  N3: { stage: "about", kind: "single", options: ["normal", "something", "unsure", "later"] },
  N4: { stage: "about", kind: "single", options: ["lastYear", "1to2years", "over2years", "never", "dontRemember"] },

  // --- Safety screening -----------------------------------------------------------
  R1: { stage: "safety", kind: "single", options: ["yes", "no", "feverish"] },
  R2: { stage: "safety", kind: "single", options: ["recent", "weeks", "no"] },
  R3: { stage: "safety", kind: "single", options: ["pregnant", "breastfeeding", "stopped", "none"] },
  R4: {
    stage: "safety",
    kind: "multi",
    options: ["weightLoss", "bonePain", "headaches", "vision", "none"],
    exclusive: ["none"],
  },
  R5: { stage: "safety", kind: "single", options: ["recent", "earlier", "no"] },

  // --- A: lump or thick area --------------------------------------------------------
  A1: { stage: "symptom", kind: "single", options: ["right", "left", "both", "armpit"] },
  A2R: { stage: "symptom", kind: "single", options: ["upperOuter", "upperInner", "lowerOuter", "lowerInner", "nipple", "unsure"] },
  A2L: { stage: "symptom", kind: "single", options: ["upperOuter", "upperInner", "lowerOuter", "lowerInner", "nipple", "unsure"] },
  A3: { stage: "symptom", kind: "single", options: ["lt1week", "1to2weeks", "gt2weeks", "gt1month"] },
  A4: { stage: "symptom", kind: "single", options: ["bigger", "different", "same", "smaller"] },
  A5: { stage: "symptom", kind: "single", options: ["yes", "no", "noPeriods", "unsure"] },
  A6: { stage: "symptom", kind: "single", options: ["soft", "rubbery", "firm", "hard", "unsure"] },
  A7: { stage: "symptom", kind: "single", options: ["smooth", "uneven", "unsure"] },
  A8: { stage: "symptom", kind: "single", options: ["moves", "stuck", "unsure"] },
  A9: { stage: "symptom", kind: "single", options: ["harmless", "unknownResult", "no"] },

  // --- B: nipple fluid --------------------------------------------------------------
  B1: { stage: "symptom", kind: "single", options: ["yes", "squeeze", "unsure"] },
  B2: { stage: "symptom", kind: "single", options: ["one", "both"] },
  B2side: { stage: "symptom", kind: "single", options: ["right", "left"], parent: "B2" },
  B3: { stage: "symptom", kind: "single", options: ["one", "several", "cantTell"] },
  B4: { stage: "symptom", kind: "single", options: ["clear", "pink", "bloody", "milky", "coloured"] },
  B5: { stage: "symptom", kind: "single", options: YES_NO },
  B6: { stage: "symptom", kind: "single", options: ["yes", "no", "noPeriods"] },
  B6b: { stage: "symptom", kind: "single", options: YES_NO, parent: "B6" },
  B7: {
    stage: "symptom",
    kind: "multi",
    options: ["antidepressants", "antipsychotics", "bloodPressure", "hormones", "strongPainkillers", "antacids", "none", "unsure"],
    exclusive: ["none", "unsure"],
  },
  B8: { stage: "symptom", kind: "single", options: YES_NO },

  // --- C: breast pain ---------------------------------------------------------------
  C1: { stage: "symptom", kind: "single", options: ["yes", "no", "noPeriods"] },
  C2: { stage: "symptom", kind: "single", options: ["both", "oneBreast", "oneSpot"] },
  C3: { stage: "symptom", kind: "single", options: ["mild", "medium", "strong"] },
  C3b: { stage: "symptom", kind: "single", options: YES_NO, parent: "C3" },
  C4: { stage: "symptom", kind: "single", options: ["lt2weeks", "2to6weeks", "gt6weeks"] },
  C5: { stage: "symptom", kind: "single", options: YES_NO },
  C6: { stage: "symptom", kind: "single", options: YES_NO },
  C7: { stage: "symptom", kind: "multi", options: ["A", "B", "D", "none"], exclusive: ["none"] },

  // --- D: skin or nipple changes ------------------------------------------------------
  D1: {
    stage: "symptom",
    kind: "multi",
    options: ["dimpling", "orangePeel", "redness", "swelling", "warm", "inversion", "scaly", "none"],
    exclusive: ["none"],
  },
  D2: { stage: "symptom", kind: "single", options: ["lt1week", "1to4weeks", "gt4weeks"] },
  D3: { stage: "symptom", kind: "single", options: ["yes", "no", "unsure"] },
  D4: { stage: "symptom", kind: "single", options: ["always", "new"] },
  D5: { stage: "symptom", kind: "single", options: ["clears", "doesNotClear", "noEczema"] },
  D6: { stage: "symptom", kind: "multi", options: ["A", "B", "none"], exclusive: ["none"] },

  // --- History ------------------------------------------------------------------------
  H1: { stage: "history", kind: "single", options: YES_NO_UNKNOWN },
  H1b: { stage: "history", kind: "single", options: ["under40", "40to49", "50plus", "unknown"], parent: "H1", optional: true },
  H2: { stage: "history", kind: "single", options: YES_NO_UNKNOWN },
  H3: { stage: "history", kind: "single", options: YES_NO_UNKNOWN },
  H4: { stage: "history", kind: "single", options: YES_NO_UNKNOWN },
  H5: { stage: "history", kind: "single", options: ["lastYearNormal", "1to2yearsNormal", "followUp", "never", "dontRemember"] },
} as const satisfies Record<string, QuestionShape>;

export type QuestionId = keyof typeof QUESTIONS;
export type OptionOf<Q extends QuestionId> = (typeof QUESTIONS)[Q]["options"][number];
export type SingleQuestionId = { [Q in QuestionId]: (typeof QUESTIONS)[Q]["kind"] extends "single" ? Q : never }[QuestionId];
export type MultiQuestionId = Exclude<QuestionId, SingleQuestionId>;

/** Answers keyed by question id: one option id, or a list for multi-select questions. */
export type TriageAnswers = { [Q in SingleQuestionId]?: OptionOf<Q> } & { [Q in MultiQuestionId]?: OptionOf<Q>[] };

export const QUESTION_IDS = Object.keys(QUESTIONS) as QuestionId[];

export function questionShape(id: QuestionId): QuestionShape {
  return QUESTIONS[id];
}

/** Follow-ups shown on a screen, in order. */
export function followUpsOf(screen: QuestionId): QuestionId[] {
  return QUESTION_IDS.filter((id) => (QUESTIONS[id] as QuestionShape).parent === screen);
}

export function isFollowUp(id: QuestionId): boolean {
  return (QUESTIONS[id] as QuestionShape).parent !== undefined;
}

/** True when the stored value is a valid, complete answer to the question. */
export function isValidAnswer(id: QuestionId, value: unknown): boolean {
  const shape = questionShape(id);
  if (shape.kind === "single") return typeof value === "string" && shape.options.includes(value);
  if (!Array.isArray(value) || value.length === 0) return false;
  if (new Set(value).size !== value.length) return false;
  if (!value.every((option) => typeof option === "string" && shape.options.includes(option))) return false;
  const exclusive = shape.exclusive ?? [];
  return value.length === 1 || !value.some((option) => exclusive.includes(option));
}

/** Applies a tap on a multi-select option, honouring exclusive options. */
export function toggleMulti(id: MultiQuestionId, current: readonly string[] | undefined, option: string): string[] {
  const chosen = current ?? [];
  if (chosen.includes(option)) return chosen.filter((value) => value !== option);
  const exclusive: readonly string[] = questionShape(id).exclusive ?? [];
  if (exclusive.includes(option)) return [option];
  return [...chosen.filter((value) => !exclusive.includes(value)), option];
}
