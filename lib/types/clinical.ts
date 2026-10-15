/**
 * Content model for clinical material. The clinical team owns the question bank,
 * branching rules, recommendations and educational text; the frontend only renders
 * and evaluates what these structures describe.
 */

/** Every piece of clinical content carries its review status so drafts are never shown as approved. */
export type ReviewStatus = "draft" | "in-review" | "approved";

export interface ClinicalReview {
  status: ReviewStatus;
  /** Who approved the content and when. Empty until the clinical team signs off. */
  reviewedBy?: string;
  reviewedOn?: string;
  /** What is still outstanding before this can be shown to the public. */
  note?: string;
}

export type ConcernId =
  | "lump-or-swelling"
  | "pain-or-discomfort"
  | "size-or-shape"
  | "skin-changes"
  | "nipple-changes"
  | "nipple-discharge"
  | "other-change"
  | "not-sure";

export interface Concern {
  id: ConcernId;
  label: string;
  /** Pathway opened for this concern, or null while no reviewed pathway exists. */
  pathwayId: string | null;
}

/** Areas of history a question can belong to. Used for grouping and reporting, never for scoring. */
export type QuestionTopic =
  | "presenting-concern"
  | "onset-duration"
  | "location"
  | "change-over-time"
  | "pain"
  | "age-reproductive-history"
  | "previous-breast-history"
  | "family-history"
  | "other";

export interface AnswerOption {
  id: string;
  label: string;
  /** Marks the "I'm not sure" style option so the interface can present it consistently. */
  kind?: "unsure";
}

/** Sentinel stored when the person used "I can't find my answer". Follows the question's default route. */
export const ANSWER_NOT_LISTED = "__not-listed__";

export type AnswerValue = string;
export type Answers = Readonly<Record<string, AnswerValue>>;

export type Condition =
  | { questionId: string; anyOf: string[] }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export type RouteTarget = { question: string } | { outcome: string };

export interface RouteRule {
  /** Omit for the default route. Rules are evaluated in order; the first match wins. */
  when?: Condition;
  goTo: RouteTarget;
}

export interface Question {
  id: string;
  topic: QuestionTopic;
  prompt: string;
  /** Optional short helper line shown under the prompt. */
  help?: string;
  /** Key into the audio map for an approved recording of this question. */
  audioKey?: string;
  options: AnswerOption[];
  /** Must end with a rule that has no `when`, so every answer has somewhere to go. */
  routes: RouteRule[];
}

export interface PathwayOutcome {
  id: string;
  /** Identifier of the approved recommendation shown for this outcome. */
  recommendationId: string;
}

export interface Pathway {
  id: string;
  /** Version of the branching rules. Sent with integration requests so results are traceable. */
  version: string;
  /** Version of the question wording this pathway was built from. */
  questionBankVersion: string;
  title: string;
  concernIds: ConcernId[];
  review: ClinicalReview;
  /** True for interface-test fixtures that must never be treated as clinical content. */
  developmentFixture?: boolean;
  startQuestionId: string;
  questions: Record<string, Question>;
  outcomes: Record<string, PathwayOutcome>;
}

export interface Recommendation {
  id: string;
  /** The next-step wording owned by the clinical pathway. Never replaced by generated text. */
  text: string;
  /** Approved short explanation, also used whenever the AI explanation is unavailable. */
  why: string;
  review: ClinicalReview;
}

export interface EducationCard {
  id: string;
  heading: string;
  body?: string;
  points?: string[];
  /** Highlighted reassurance or guidance sentence. */
  callout?: string;
  audioKey?: string;
  /** Asks "Have you noticed any of these changes?" on this card. */
  askAboutChanges?: boolean;
}

export interface EducationModule {
  slug: string;
  title: string;
  summary: string;
  icon: "heart" | "eye" | "leaf" | "stethoscope";
  cards: EducationCard[];
  review: ClinicalReview;
}
