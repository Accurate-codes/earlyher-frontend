import {
  ANSWER_NOT_LISTED,
  type Answers,
  type Condition,
  type Pathway,
  type Question,
  type RouteTarget,
} from "@/lib/types/clinical";

/**
 * Pure pathway evaluation. The engine only follows the routes a pathway declares;
 * it holds no clinical rules of its own and never scores or ranks answers.
 */

export interface ActivePath {
  /** Questions answered so far on the branch that currently applies, in order. */
  answeredQuestionIds: string[];
  /** The next unanswered question, or null once the pathway has reached an outcome. */
  currentQuestionId: string | null;
  /** Outcome reached, or null while questions remain. */
  outcomeId: string | null;
}

export interface ProgressInfo {
  /** 1-based position of the current question. */
  position: number;
  /** Total questions on this branch, only when every remaining route has the same length. */
  total: number | null;
}

function matches(condition: Condition, answers: Answers): boolean {
  if ("questionId" in condition) {
    const answer = answers[condition.questionId];
    return answer !== undefined && condition.anyOf.includes(answer);
  }
  if ("all" in condition) return condition.all.every((c) => matches(c, answers));
  if ("any" in condition) return condition.any.some((c) => matches(c, answers));
  return !matches(condition.not, answers);
}

function resolveRoute(question: Question, answers: Answers): RouteTarget {
  for (const rule of question.routes) {
    if (!rule.when || matches(rule.when, answers)) return rule.goTo;
  }
  // validatePathway guarantees a default route; reaching here means unvalidated content.
  throw new Error(`Question "${question.id}" has no default route.`);
}

function isValidAnswer(question: Question, answer: string | undefined): answer is string {
  if (answer === undefined) return false;
  return answer === ANSWER_NOT_LISTED || question.options.some((o) => o.id === answer);
}

/** Walks the pathway from its first question, following only the branch the answers select. */
export function getActivePath(pathway: Pathway, answers: Answers): ActivePath {
  const answeredQuestionIds: string[] = [];
  const seen = new Set<string>();
  let questionId: string | null = pathway.startQuestionId;

  while (questionId) {
    if (seen.has(questionId)) throw new Error(`Pathway "${pathway.id}" loops at "${questionId}".`);
    seen.add(questionId);

    const question: Question | undefined = pathway.questions[questionId];
    if (!question) throw new Error(`Pathway "${pathway.id}" references unknown question "${questionId}".`);

    if (!isValidAnswer(question, answers[questionId])) {
      return { answeredQuestionIds, currentQuestionId: questionId, outcomeId: null };
    }
    answeredQuestionIds.push(questionId);

    const target = resolveRoute(question, answers);
    if ("outcome" in target) {
      return { answeredQuestionIds, currentQuestionId: null, outcomeId: target.outcome };
    }
    questionId = target.question;
  }
  return { answeredQuestionIds, currentQuestionId: null, outcomeId: null };
}

/** Drops answers to questions that are no longer on the active branch. */
export function pruneAnswers(pathway: Pathway, answers: Answers): Record<string, string> {
  const active = new Set(getActivePath(pathway, answers).answeredQuestionIds);
  return Object.fromEntries(Object.entries(answers).filter(([id]) => active.has(id)));
}

/**
 * Records an answer and removes any earlier responses that belonged to a branch
 * the new answer no longer leads to.
 */
export function applyAnswer(
  pathway: Pathway,
  answers: Answers,
  questionId: string,
  answer: string,
): Record<string, string> {
  const question = pathway.questions[questionId];
  if (!question) throw new Error(`Unknown question "${questionId}".`);
  if (!isValidAnswer(question, answer)) {
    throw new Error(`"${answer}" is not an answer to "${questionId}".`);
  }
  return pruneAnswers(pathway, { ...answers, [questionId]: answer });
}

/** Removes the answer to a question (and anything after it) so it can be asked again. */
export function reopenQuestion(pathway: Pathway, answers: Answers, questionId: string): Record<string, string> {
  const rest = { ...answers };
  delete rest[questionId];
  return pruneAnswers(pathway, rest);
}

/** Shortest and longest number of questions from `questionId` to any outcome, inclusive. */
function remainingRange(pathway: Pathway, questionId: string, trail: Set<string>): [number, number] {
  if (trail.has(questionId)) return [Infinity, Infinity];
  const question = pathway.questions[questionId];
  if (!question) return [Infinity, Infinity];

  const next = new Set(trail).add(questionId);
  let min = Infinity;
  let max = 0;
  for (const rule of question.routes) {
    const [lo, hi] = "outcome" in rule.goTo ? [0, 0] : remainingRange(pathway, rule.goTo.question, next);
    min = Math.min(min, lo);
    max = Math.max(max, hi);
  }
  return [min + 1, max + 1];
}

/**
 * Reports progress without overstating it: a total is only given when every route
 * still open from the current question has the same number of questions left.
 */
export function getProgress(pathway: Pathway, answers: Answers): ProgressInfo | null {
  const path = getActivePath(pathway, answers);
  if (!path.currentQuestionId) return null;
  const position = path.answeredQuestionIds.length + 1;
  const [min, max] = remainingRange(pathway, path.currentQuestionId, new Set());
  const total = min === max && Number.isFinite(max) ? path.answeredQuestionIds.length + max : null;
  return { position, total };
}

/** Structural checks run on every pathway before it is offered to a user. */
export function validatePathway(pathway: Pathway): string[] {
  const problems: string[] = [];
  if (!pathway.version) problems.push("Missing pathway version.");
  if (!pathway.questionBankVersion) problems.push("Missing question bank version.");
  if (!pathway.questions[pathway.startQuestionId]) problems.push("Start question does not exist.");

  for (const [key, question] of Object.entries(pathway.questions)) {
    if (key !== question.id) problems.push(`Question key "${key}" does not match id "${question.id}".`);
    if (question.options.length === 0) problems.push(`Question "${key}" has no answer options.`);

    const last = question.routes[question.routes.length - 1];
    if (!last || last.when) problems.push(`Question "${key}" must end with a default route.`);

    for (const rule of question.routes) {
      if ("outcome" in rule.goTo) {
        if (!pathway.outcomes[rule.goTo.outcome]) {
          problems.push(`Question "${key}" routes to unknown outcome "${rule.goTo.outcome}".`);
        }
      } else if (!pathway.questions[rule.goTo.question]) {
        problems.push(`Question "${key}" routes to unknown question "${rule.goTo.question}".`);
      }
    }
  }

  if (problems.length === 0) {
    const [, max] = remainingRange(pathway, pathway.startQuestionId, new Set());
    if (!Number.isFinite(max)) problems.push("Pathway contains a loop.");
  }
  return problems;
}
