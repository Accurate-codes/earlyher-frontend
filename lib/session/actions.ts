import { firstUnanswered, isAnswered, setAnswer, visibleQuestions } from "@/lib/questionnaire/engine";
import type { AnswerValue, Questionnaire } from "@/lib/types/questionnaire";
import type { QuestionnaireStep, SessionStore } from "./session-store";

/**
 * Questionnaire session changes shared by the screens. Kept free of React so they can
 * be tested directly. Answers stay in memory: nothing here stores, sends or logs them.
 */

export function startQuestionnaire(store: SessionStore, questionnaire: Questionnaire) {
  const first = visibleQuestions(questionnaire, {})[0];
  store.update({
    questionnaireId: questionnaire.id,
    answers: {},
    step: first ? { questionId: first.id } : { review: true },
    submitted: false,
  });
}

/** Records (or clears) an answer and drops answers to follow-ups that no longer apply. */
export function answerQuestion(
  store: SessionStore,
  questionnaire: Questionnaire,
  questionId: string,
  value: AnswerValue | undefined,
) {
  const answers = setAnswer(questionnaire, store.getState().answers, questionId, value);
  store.update({ answers, submitted: false });
}

/** The step after `step`, given the current answers: the next applicable question, then review. */
export function stepAfter(
  questionnaire: Questionnaire,
  answers: Record<string, AnswerValue>,
  step: QuestionnaireStep,
): QuestionnaireStep {
  if ("review" in step) return step;
  const visible = visibleQuestions(questionnaire, answers);
  const index = visible.findIndex((q) => q.id === step.questionId);
  const next = index >= 0 ? visible[index + 1] : undefined;
  return next ? { questionId: next.id } : { review: true };
}

/** The step before `step`, or null at the first question. */
export function stepBefore(
  questionnaire: Questionnaire,
  answers: Record<string, AnswerValue>,
  step: QuestionnaireStep,
): QuestionnaireStep | null {
  const visible = visibleQuestions(questionnaire, answers);
  if ("review" in step) {
    const last = visible[visible.length - 1];
    return last ? { questionId: last.id } : null;
  }
  const index = visible.findIndex((q) => q.id === step.questionId);
  const previous = index > 0 ? visible[index - 1] : undefined;
  return previous ? { questionId: previous.id } : null;
}

/** Whether the person may move on from this question (answered, or optional). */
export function canContinue(questionnaire: Questionnaire, answers: Record<string, AnswerValue>, questionId: string) {
  const question = questionnaire.questions.find((q) => q.id === questionId);
  return !question || !question.required || isAnswered(question, answers[questionId]);
}

/**
 * Confirms the answers from the review step. If a required question is still open,
 * returns that question instead so the screen can take the person to it.
 */
export function submitAnswers(store: SessionStore, questionnaire: Questionnaire): { ok: true } | { ok: false; questionId: string } {
  const missing = firstUnanswered(questionnaire, store.getState().answers);
  if (missing) return { ok: false, questionId: missing.id };
  store.update({ submitted: true });
  return { ok: true };
}
