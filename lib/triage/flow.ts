import {
  BRANCH_ORDER,
  QUESTION_IDS,
  followUpsOf,
  isValidAnswer,
  questionShape,
  type Branch,
  type QuestionId,
  type Stage,
  type TriageAnswers,
} from "./questions";
import { activeBranches, evaluate, ORANGE, RED } from "./rules";

/**
 * Navigation for the triage: which screens apply, in which order, and what happens
 * when an earlier answer changes. Everything is derived from the stored answers by
 * replaying the journey from the start, so the branch queue, skipped questions and
 * urgency are always rebuilt from current applicable answers, never accumulated.
 */

export type Entry = "concern" | "no-concern";
export type Cursor = QuestionId | "welcome" | "result" | "deferred";
export type PathEnd = "result" | "red-exit" | "deferred";

export const CONSENT_POLICY_VERSION = "2026-10-23";

export interface TriageState {
  /** Which home-screen button started the journey. */
  entry: Entry;
  /** Consent to use answers for guidance. Saving and sharing have their own consent. */
  consent: { acceptedAt: string; policyVersion: string } | null;
  /** Stored answers. Some may be hidden (not applicable); use buildPath().answers for anything shown or evaluated. */
  answers: TriageAnswers;
  cursor: Cursor;
  /** Screen where the person chose to keep answering after an early Red result. */
  continuedFrom: QuestionId | null;
  /** Consent to keep progress on this device, when given. */
  save: { consentedAt: string } | null;
}

export interface Path {
  /** Question screens on the current path, in order. The last one may still need an answer. */
  screens: QuestionId[];
  /** How the journey ends, or null while a screen still needs an answer. */
  end: PathEnd | null;
  /** Applicable, valid answers only. The single source for evaluation and the summary. */
  answers: TriageAnswers;
  /** Symptom branches in the order they are asked, without duplicates. */
  queue: Branch[];
  completedBranches: Branch[];
  /** Questions the rules decided not to ask (for example A4 when the lump is under a week old). */
  notAsked: QuestionId[];
  redExitAt: QuestionId | null;
}

/** Short follow-ups shown on their parent's screen, and when they apply. */
const FOLLOW_UP_APPLIES: Partial<Record<QuestionId, (answers: TriageAnswers) => boolean>> = {
  B2side: (a) => a.B2 === "one",
  B6b: (a) => a.B6 === "noPeriods",
  C3b: () => true,
  H1b: (a) => a.H1 === "yes",
};

export function followUpApplies(id: QuestionId, answers: TriageAnswers): boolean {
  return FOLLOW_UP_APPLIES[id]?.(answers) ?? false;
}

/** The questions shown on a screen right now: the primary question and applicable follow-ups. */
export function screenQuestions(screen: QuestionId, answers: TriageAnswers): QuestionId[] {
  return [screen, ...followUpsOf(screen).filter((id) => followUpApplies(id, answers))];
}

export function isScreenComplete(screen: QuestionId, answers: TriageAnswers): boolean {
  return screenQuestions(screen, answers).every(
    (id) => questionShape(id).optional || isValidAnswer(id, answers[id]),
  );
}

export function branchOf(id: QuestionId): Branch | null {
  const first = id[0];
  return first === "A" || first === "B" || first === "C" || first === "D" ? first : null;
}

/** Adds newly disclosed branches straight after the current one, skipping any already queued or done. */
export function insertAfterCurrent(queue: Branch[], currentIndex: number, disclosed: Branch[]): Branch[] {
  const next = [...queue];
  let at = currentIndex + 1;
  for (const branch of BRANCH_ORDER.filter((b) => disclosed.includes(b))) {
    if (next.includes(branch)) continue;
    next.splice(at, 0, branch);
    at += 1;
  }
  return next;
}

/** Branches named in a "Do you also have…" answer. */
const disclosed = (values: readonly string[] = []): Branch[] => BRANCH_ORDER.filter((branch) => values.includes(branch));

class Stop {
  constructor(readonly end: PathEnd | null) {}
}

/** Replays the journey from the start using the stored answers. */
export function buildPath(state: Pick<TriageState, "entry" | "answers" | "continuedFrom">): Path {
  const stored = state.answers as Record<string, unknown>;
  const kept: Record<string, unknown> = {};
  const answers = kept as TriageAnswers;
  const screens: QuestionId[] = [];
  const notAsked: QuestionId[] = [];
  let queue: Branch[] = [];
  const completedBranches: Branch[] = [];
  let redSeen = false;
  let redExitAt: QuestionId | null = null;

  const copy = (id: QuestionId) => {
    if (isValidAnswer(id, stored[id])) kept[id] = stored[id];
  };

  const step = (screen: QuestionId) => {
    screens.push(screen);
    copy(screen);
    for (const id of followUpsOf(screen)) if (followUpApplies(id, answers)) copy(id);
    if (!isScreenComplete(screen, answers)) throw new Stop(null);
    // An answer that first makes the result Red ends the questions early, unless the
    // person has chosen to carry on from this screen.
    const red = evaluate(answers).level === RED;
    if (red && !redSeen) {
      redSeen = true;
      if (state.continuedFrom !== screen) {
        redExitAt = screen;
        throw new Stop("red-exit");
      }
    }
  };

  const skip = (...ids: QuestionId[]) => notAsked.push(...ids);

  const branchSteps: Record<Branch, (index: number) => void> = {
    A: () => {
      step("A1");
      if (answers.A1 === "armpit") skip("A2R", "A2L");
      else {
        if (answers.A1 === "right" || answers.A1 === "both") step("A2R");
        if (answers.A1 === "left" || answers.A1 === "both") step("A2L");
      }
      step("A3");
      if (answers.A3 === "lt1week") skip("A4");
      else step("A4");
      for (const id of ["A5", "A6", "A7", "A8", "A9"] as const) step(id);
    },
    B: (index) => {
      for (const id of ["B1", "B2", "B3", "B4", "B5"] as const) step(id);
      if (answers.B5 === "yes") queue = insertAfterCurrent(queue, index, ["A", "D"]);
      step("B6");
      step("B7");
      if (answers.R2 === "recent" || answers.R2 === "weeks") skip("B8");
      else step("B8");
    },
    C: (index) => {
      for (const id of ["C1", "C2", "C3", "C4", "C5"] as const) step(id);
      if (answers.R2 === "recent" || answers.R2 === "weeks") skip("C6");
      else step("C6");
      step("C7");
      queue = insertAfterCurrent(queue, index, disclosed(answers.C7));
    },
    D: (index) => {
      step("D1");
      const d1 = answers.D1 ?? [];
      if (d1.includes("none")) skip("D2", "D3", "D4", "D5");
      else {
        step("D2");
        step("D3");
        // Both follow-ups are asked when both changes were chosen; each adjusts only its own finding.
        if (d1.includes("inversion")) step("D4");
        else skip("D4");
        if (d1.includes("scaly")) step("D5");
        else skip("D5");
      }
      step("D6");
      queue = insertAfterCurrent(queue, index, disclosed(answers.D6));
    },
  };

  let end: PathEnd | null = null;
  try {
    if (state.entry === "concern") step("Q1");
    else kept.Q1 = ["N"];
    step("Q1b");

    if (answers.Q1?.includes("N")) {
      step("N1");
      step("N2");
      if (answers.N2 === "normal") {
        step("N3");
        if (answers.N3 === "normal") {
          step("N4");
          throw new Stop("result");
        }
        if (answers.N3 === "later") throw new Stop("deferred");
        // A lump, or uncertainty about one, moves the person into the concern questions.
        queue = ["A"];
      } else {
        queue = ["D"];
      }
    } else {
      queue = BRANCH_ORDER.filter((branch) => answers.Q1?.includes(branch));
    }

    for (const id of ["R1", "R2", "R3", "R4", "R5"] as const) step(id);

    for (let index = 0; index < queue.length; index += 1) {
      branchSteps[queue[index]](index);
      completedBranches.push(queue[index]);
    }

    // Already Orange or Red: the risk-history questions cannot change the result, so only H5 is asked.
    if (evaluate(answers).level >= ORANGE) {
      skip("H1", "H2", "H3", "H4");
      step("H5");
    } else {
      for (const id of ["H1", "H2", "H3", "H4", "H5"] as const) step(id);
    }
    end = "result";
  } catch (error) {
    if (!(error instanceof Stop)) throw error;
    end = error.end;
  }

  return { screens, end, answers, queue, completedBranches, notAsked, redExitAt };
}

/** Questions that can no longer apply, given the decisions made so far on the path. */
function excludedQuestions(path: Path): Set<QuestionId> {
  const excluded = new Set<QuestionId>(path.notAsked);
  for (const screen of path.screens) {
    for (const id of followUpsOf(screen)) if (!followUpApplies(id, path.answers)) excluded.add(id);
  }
  const q1 = path.answers.Q1;
  if (q1 && !q1.includes("N")) for (const id of ["N1", "N2", "N3", "N4"] as const) excluded.add(id);
  if (path.answers.N2 && path.answers.N2 !== "normal") excluded.add("N3").add("N4");
  if (path.answers.N3 && path.answers.N3 !== "normal") excluded.add("N4");
  return excluded;
}

/**
 * Removes answers that no longer apply after an earlier answer changed. When the
 * journey is complete, only answers on the path are kept. While it is incomplete,
 * answers that may still apply further on are kept, so nothing is asked twice; answers
 * the path has ruled out, or that belong to a branch nothing discloses any more, go.
 */
export function pruneAnswers(state: Pick<TriageState, "entry" | "answers" | "continuedFrom">): TriageAnswers {
  let answers = state.answers;
  for (let round = 0; round < 8; round += 1) {
    const path = buildPath({ ...state, answers });
    if (path.end === "result" || path.end === "deferred") return path.answers;
    const excluded = excludedQuestions(path);
    const possible = new Set(activeBranches(answers));
    const next: Record<string, unknown> = {};
    for (const id of QUESTION_IDS) {
      const value = (answers as Record<string, unknown>)[id];
      if (value === undefined) continue;
      const onPath = (path.answers as Record<string, unknown>)[id] !== undefined;
      const branch = branchOf(id);
      const mayApply = !excluded.has(id) && (branch === null || possible.has(branch));
      if (onPath || mayApply) next[id] = value;
    }
    if (Object.keys(next).length === Object.keys(answers).length) return next as TriageAnswers;
    answers = next as TriageAnswers;
  }
  return answers;
}

// --- State changes (pure) -----------------------------------------------------------------

export function createTriage(entry: Entry): TriageState {
  return {
    entry,
    consent: null,
    answers: entry === "no-concern" ? { Q1: ["N"] } : {},
    cursor: "welcome",
    continuedFrom: null,
    save: null,
  };
}

export function acceptConsent(state: TriageState, now: Date): TriageState {
  const consent = { acceptedAt: now.toISOString(), policyVersion: CONSENT_POLICY_VERSION };
  return { ...state, consent, cursor: buildPath(state).screens[0] };
}

/** Records an answer. Nothing is pruned until the person moves on, so a slip of the finger loses nothing. */
export function setAnswer(state: TriageState, id: QuestionId, value: string | string[] | undefined): TriageState {
  const answers = { ...state.answers } as Record<string, unknown>;
  if (value === undefined || (Array.isArray(value) && value.length === 0)) delete answers[id];
  else answers[id] = value;
  return { ...state, answers: answers as TriageAnswers };
}

/** The resolved cursor: a cursor that is no longer valid falls back to the furthest reachable screen. */
export function resolveCursor(state: TriageState, path: Path = buildPath(state)): Cursor {
  const { cursor } = state;
  if (cursor === "welcome") return cursor;
  if (cursor === "result") return path.end === "result" || path.end === "red-exit" ? cursor : lastScreen(path);
  if (cursor === "deferred") return path.end === "deferred" ? cursor : lastScreen(path);
  return path.screens.includes(cursor) ? cursor : lastScreen(path);
}

function lastScreen(path: Path): Cursor {
  return path.screens[path.screens.length - 1] ?? "welcome";
}

function endCursor(end: PathEnd): Cursor {
  return end === "deferred" ? "deferred" : "result";
}

/**
 * Moves on from the current screen. Returns null when the screen still needs an answer.
 * Answers that no longer apply are removed here, then the path is rebuilt.
 */
export function advance(state: TriageState, from: QuestionId): TriageState | null {
  if (resolveCursor(state) !== from) return null;
  const current = buildPath(state);
  if (!isScreenComplete(from, current.answers)) return null;
  const answers = pruneAnswers(state);
  const pruned = { ...state, answers };
  const path = buildPath(pruned);
  const index = path.screens.indexOf(from);
  const next = path.screens[index + 1];
  if (next) return { ...pruned, cursor: next };
  return path.end ? { ...pruned, cursor: endCursor(path.end) } : null;
}

export function goBack(state: TriageState): TriageState {
  const path = buildPath(state);
  const cursor = resolveCursor(state, path);
  if (cursor === "welcome") return state;
  if (cursor === "result" || cursor === "deferred") return { ...state, cursor: lastScreen(path) };
  const index = path.screens.indexOf(cursor);
  return { ...state, cursor: index > 0 ? path.screens[index - 1] : "welcome" };
}

/** After an early Red result, carries on with the next question for the doctor's benefit. */
export function continueAfterRed(state: TriageState): TriageState {
  const path = buildPath(state);
  if (path.end !== "red-exit" || !path.redExitAt) return state;
  const continued = { ...state, continuedFrom: path.redExitAt };
  const next = buildPath(continued);
  const following = next.screens[next.screens.indexOf(path.redExitAt) + 1];
  return { ...continued, cursor: following ?? (next.end ? endCursor(next.end) : lastScreen(next)) };
}

/** Switches between the concern and no-concern journeys, keeping consent and age. */
export function switchEntry(state: TriageState, entry: Entry): TriageState {
  if (state.entry === entry) return state;
  const answers = { Q1b: state.answers.Q1b, ...(entry === "no-concern" ? { Q1: ["N"] } : {}) } as TriageAnswers;
  if (answers.Q1b === undefined) delete answers.Q1b;
  const next: TriageState = { ...state, entry, answers, continuedFrom: null };
  return { ...next, cursor: state.consent ? buildPath(next).screens[0] : "welcome" };
}

/** Stages this journey goes through, for the progress indicator. */
export function journeyStages(path: Path): Stage[] {
  const selfCheckOnly = path.answers.Q1?.includes("N") && path.queue.length === 0;
  return selfCheckOnly ? ["about"] : ["about", "safety", "symptom", "history"];
}

export function stageOf(id: QuestionId): Stage {
  return questionShape(id).stage;
}

/** True when the result was shown before every question was answered (early Red). */
export function isIncomplete(path: Path): boolean {
  return path.end === "red-exit";
}
