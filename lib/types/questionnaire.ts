import type { ClinicalReview } from "./clinical";

/**
 * Configurable breast-concern questionnaire. The clinical lead owns the questions,
 * conditions and urgency rules; the app only renders and evaluates what is declared.
 *
 * Text is given per language. English is required; another language is shown only
 * when that language's translation has been reviewed (see `translations`).
 */

export type Locale = "en" | "yo";

export type LocalizedText = { en: string } & Partial<Record<Exclude<Locale, "en">, string>>;

/**
 * "yes-no-unsure": Yes / No / I don't know, with built-in option ids below.
 * "single": one option from `options`.
 * "multiple": one or more options from `options` (for several symptoms at once).
 */
export type ResponseType = "yes-no-unsure" | "single" | "multiple";

export const YES = "yes";
export const NO = "no";
export const UNSURE = "unsure";
export const YES_NO_UNSURE_IDS = [YES, NO, UNSURE] as const;

export interface QuestionnaireOption {
  id: string;
  label: LocalizedText;
  /**
   * "unsure": an "I don't know" style answer.
   * "exclusive": in a multiple-choice question, choosing it clears the others (e.g. "None of these").
   */
  kind?: "unsure" | "exclusive";
}

/** Conditions refer only to questions that come earlier in the list. */
export type QuestionCondition =
  | { questionId: string; anyOf: string[] }
  | { all: QuestionCondition[] }
  | { any: QuestionCondition[] }
  | { not: QuestionCondition };

export interface QuestionnaireQuestion {
  id: string;
  prompt: LocalizedText;
  help?: LocalizedText;
  type: ResponseType;
  /** Required for "single" and "multiple"; ignored for "yes-no-unsure". */
  options?: QuestionnaireOption[];
  required: boolean;
  /** Ask this question only when the condition holds. Omit to always ask. */
  showIf?: QuestionCondition;
  audioKey?: string;
}

export type AnswerValue = string | string[];
export type QuestionnaireAnswers = Readonly<Record<string, AnswerValue>>;

export interface UrgencyLevel {
  id: string;
  /** Short heading, e.g. how soon to seek care. Supplied by the clinical lead. */
  title: LocalizedText;
  description: LocalizedText;
  /** Visual emphasis only; the wording carries the meaning. */
  tone: "urgent" | "soon" | "routine";
}

export interface UrgencyRule {
  id: string;
  /** Omit for the default rule, which must be last. First match wins. */
  when?: QuestionCondition;
  levelId: string;
}

export interface UrgencyRules {
  version: string;
  review: ClinicalReview;
  levels: Record<string, UrgencyLevel>;
  rules: UrgencyRule[];
}

export interface Questionnaire {
  id: string;
  version: string;
  review: ClinicalReview;
  /** True for interface-test fixtures, which must never be shown as clinical content. */
  developmentFixture?: boolean;
  questions: QuestionnaireQuestion[];
  /** Absent until the clinical lead supplies approved urgency rules. */
  urgency?: UrgencyRules;
  /** Review status of each non-English translation of this questionnaire's text. */
  translations?: Partial<Record<Exclude<Locale, "en">, ClinicalReview>>;
}
