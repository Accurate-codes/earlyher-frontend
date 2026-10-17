import {
  YES_NO_UNSURE_IDS,
  type AnswerValue,
  type QuestionCondition,
  type Questionnaire,
  type QuestionnaireAnswers,
  type QuestionnaireQuestion,
  type UrgencyLevel,
} from "@/lib/types/questionnaire";

/**
 * Pure questionnaire evaluation. It follows only the conditions and rules the content
 * declares; it holds no clinical logic of its own and never scores answers.
 */

export function optionIds(question: QuestionnaireQuestion): string[] {
  return question.type === "yes-no-unsure" ? [...YES_NO_UNSURE_IDS] : (question.options ?? []).map((o) => o.id);
}

function selected(value: AnswerValue | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function matches(condition: QuestionCondition, answers: QuestionnaireAnswers): boolean {
  if ("questionId" in condition) return selected(answers[condition.questionId]).some((id) => condition.anyOf.includes(id));
  if ("all" in condition) return condition.all.every((c) => matches(c, answers));
  if ("any" in condition) return condition.any.some((c) => matches(c, answers));
  return !matches(condition.not, answers);
}

/** True when the value is a complete, valid answer to the question. */
export function isAnswered(question: QuestionnaireQuestion, value: AnswerValue | undefined): boolean {
  const ids = optionIds(question);
  if (question.type === "multiple") {
    if (!Array.isArray(value) || value.length === 0) return false;
    if (!value.every((id) => ids.includes(id))) return false;
    const exclusive = (question.options ?? []).filter((o) => o.kind === "exclusive").map((o) => o.id);
    return value.length === 1 || !value.some((id) => exclusive.includes(id));
  }
  return typeof value === "string" && ids.includes(value);
}

/**
 * The questions that currently apply, in order. A question's condition is checked
 * against answers to the questions shown before it, so hidden questions never
 * influence later ones.
 */
export function visibleQuestions(questionnaire: Questionnaire, answers: QuestionnaireAnswers): QuestionnaireQuestion[] {
  const effective: Record<string, AnswerValue> = {};
  const visible: QuestionnaireQuestion[] = [];
  for (const question of questionnaire.questions) {
    if (question.showIf && !matches(question.showIf, effective)) continue;
    visible.push(question);
    const value = answers[question.id];
    if (isAnswered(question, value)) effective[question.id] = value;
  }
  return visible;
}

/** Keeps only valid answers to questions that still apply. */
export function pruneAnswers(questionnaire: Questionnaire, answers: QuestionnaireAnswers): Record<string, AnswerValue> {
  const result: Record<string, AnswerValue> = {};
  for (const question of visibleQuestions(questionnaire, answers)) {
    const value = answers[question.id];
    if (isAnswered(question, value)) result[question.id] = value;
  }
  return result;
}

/**
 * Records an answer (or clears it with undefined) and removes answers to follow-up
 * questions that no longer apply.
 */
export function setAnswer(
  questionnaire: Questionnaire,
  answers: QuestionnaireAnswers,
  questionId: string,
  value: AnswerValue | undefined,
): Record<string, AnswerValue> {
  const next: Record<string, AnswerValue> = { ...answers };
  if (value === undefined || (Array.isArray(value) && value.length === 0)) delete next[questionId];
  else next[questionId] = value;
  return pruneAnswers(questionnaire, next);
}

/** Applies a tap on a multiple-choice option, honouring "exclusive" options. */
export function toggleOption(question: QuestionnaireQuestion, current: AnswerValue | undefined, optionId: string): string[] {
  const chosen = selected(current);
  if (chosen.includes(optionId)) return chosen.filter((id) => id !== optionId);
  const exclusive = new Set((question.options ?? []).filter((o) => o.kind === "exclusive").map((o) => o.id));
  if (exclusive.has(optionId)) return [optionId];
  return [...chosen.filter((id) => !exclusive.has(id)), optionId];
}

/** First question that still needs an answer, or null when everything required is answered. */
export function firstUnanswered(questionnaire: Questionnaire, answers: QuestionnaireAnswers): QuestionnaireQuestion | null {
  return (
    visibleQuestions(questionnaire, answers).find(
      (question) => question.required && !isAnswered(question, answers[question.id]),
    ) ?? null
  );
}

export type UrgencyOutcome =
  | { status: "incomplete" }
  /** No approved urgency rules exist yet. The interface must say so, not guess. */
  | { status: "pending" }
  | { status: "level"; level: UrgencyLevel; ruleId: string };

/** Urgency is decided only by approved rules (or a labelled development fixture). */
export function evaluateUrgency(questionnaire: Questionnaire, answers: QuestionnaireAnswers): UrgencyOutcome {
  if (firstUnanswered(questionnaire, answers)) return { status: "incomplete" };
  const urgency = questionnaire.urgency;
  const usable =
    urgency &&
    (questionnaire.developmentFixture ||
      (questionnaire.review.status === "approved" && urgency.review.status === "approved"));
  if (!urgency || !usable) return { status: "pending" };

  const effective = pruneAnswers(questionnaire, answers);
  for (const rule of urgency.rules) {
    if (!rule.when || matches(rule.when, effective)) {
      const level = urgency.levels[rule.levelId];
      return level ? { status: "level", level, ruleId: rule.id } : { status: "pending" };
    }
  }
  return { status: "pending" };
}

function conditionRefs(condition: QuestionCondition): { questionId: string; anyOf: string[] }[] {
  if ("questionId" in condition) return [condition];
  if ("all" in condition) return condition.all.flatMap(conditionRefs);
  if ("any" in condition) return condition.any.flatMap(conditionRefs);
  return conditionRefs(condition.not);
}

/** Structural checks run before a questionnaire is offered. An invalid one is never shown. */
export function validateQuestionnaire(questionnaire: Questionnaire): string[] {
  const problems: string[] = [];
  if (!questionnaire.version) problems.push("Missing version.");
  if (questionnaire.questions.length === 0) problems.push("No questions.");

  const seen = new Map<string, QuestionnaireQuestion>();
  const checkRefs = (where: string, condition: QuestionCondition, allowed: Map<string, QuestionnaireQuestion>) => {
    for (const ref of conditionRefs(condition)) {
      const target = allowed.get(ref.questionId);
      if (!target) {
        problems.push(`${where} refers to "${ref.questionId}", which is not an earlier question.`);
        continue;
      }
      const ids = optionIds(target);
      for (const id of ref.anyOf) if (!ids.includes(id)) problems.push(`${where} refers to unknown answer "${id}".`);
    }
  };

  for (const question of questionnaire.questions) {
    if (seen.has(question.id)) problems.push(`Duplicate question id "${question.id}".`);
    if (!question.prompt.en) problems.push(`Question "${question.id}" has no English prompt.`);
    if (question.type !== "yes-no-unsure") {
      const options = question.options ?? [];
      if (options.length < 2) problems.push(`Question "${question.id}" needs at least two options.`);
      if (new Set(options.map((o) => o.id)).size !== options.length) {
        problems.push(`Question "${question.id}" has duplicate option ids.`);
      }
    }
    if (question.showIf) checkRefs(`Question "${question.id}"`, question.showIf, seen);
    seen.set(question.id, question);
  }

  const urgency = questionnaire.urgency;
  if (urgency) {
    const last = urgency.rules[urgency.rules.length - 1];
    if (!last || last.when) problems.push("Urgency rules must end with a default rule.");
    for (const rule of urgency.rules) {
      if (!urgency.levels[rule.levelId]) problems.push(`Urgency rule "${rule.id}" uses unknown level "${rule.levelId}".`);
      if (rule.when) checkRefs(`Urgency rule "${rule.id}"`, rule.when, seen);
    }
  }
  return problems;
}
