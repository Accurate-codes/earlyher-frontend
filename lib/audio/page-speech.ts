import type { Evaluation } from "@/lib/triage/rules";

/**
 * What Listen reads on screens built from several pieces of content, as content ids in
 * the order they appear on screen (see speech-catalog.ts). Only fixed wording: never a
 * person's answers, facility records, counts or dates.
 */

const list = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => `${prefix}.${index}`);

export const RESULT_READY_SPEECH = ["triage.results.ready", "triage.results.title"];

export const NO_RESULT_SPEECH = ["triage.results.noResult.title", "triage.results.noResult.text"];

/** The next-steps page: how soon, the explanation, what to do, why, and what to bring. */
export function resultSpeech(evaluation: Evaluation, shownReasons: readonly string[], incomplete: boolean, bringCount: number): string[] {
  const outcome = `triage.results.outcomes.${evaluation.outcome}`;
  return [
    "triage.results.howSoon",
    `${outcome}.label`,
    `${outcome}.timeframe`,
    `${outcome}.headline`,
    `${outcome}.body`,
    ...(evaluation.outcome === "red" ? ["triage.welcome.emergency"] : []),
    ...(evaluation.advice.length > 0 ? ["triage.results.nextHeading", ...evaluation.advice.map((key) => `triage.results.advice.${key}`)] : []),
    ...(incomplete ? ["triage.results.incompleteTitle", "triage.results.incompleteText"] : []),
    "triage.results.reasonsHeading",
    ...shownReasons.map((key) => `triage.results.reasons.${key}`),
    ...(evaluation.outcome !== "green" ? ["triage.results.bringHeading", ...list("triage.results.bring", bringCount)] : []),
    "safety.text",
  ];
}

/** The doctor summary: the guidance and why. The answers themselves are not read. */
export function summarySpeech(evaluation: Evaluation, incomplete: boolean): string[] {
  const outcome = `triage.results.outcomes.${evaluation.outcome}`;
  return [
    "triage.summary.title",
    "triage.summary.intro",
    "triage.summary.urgency",
    `${outcome}.headline`,
    `${outcome}.timeframe`,
    ...(incomplete ? ["triage.summary.incomplete"] : []),
    "triage.summary.reasons",
    ...evaluation.reasons.map((key) => `triage.results.reasons.${key}`),
    ...evaluation.advice.map((key) => `triage.results.advice.${key}`),
  ];
}

export function privacySpeech(pointCount: number): string[] {
  return ["triage.privacy.title", "triage.privacy.intro", ...list("triage.privacy.points", pointCount), "triage.privacy.pending"];
}

/** The healthcare finder: what it is, the person's guidance if they have a result, and how to use it. */
export function finderSpeech(guidance: Evaluation | null): string[] {
  const outcome = guidance && `triage.results.outcomes.${guidance.outcome}`;
  return [
    "ui.finder.title",
    "ui.finder.intro",
    ...(guidance
      ? [
          "triage.finderContext.heading",
          `${outcome}.headline`,
          `${outcome}.timeframe`,
          ...(guidance.outcome === "red" ? ["triage.finderContext.redNote"] : []),
          ...(guidance.outcome !== "green" ? ["triage.finderContext.windowNote"] : []),
        ]
      : []),
    "ui.finder.searchLabel",
    "ui.finder.mapHelp",
    "ui.finder.breastCareNote",
    "ui.finder.unverifiedNote",
  ];
}
