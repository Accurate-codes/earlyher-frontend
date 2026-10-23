/**
 * Content model for clinical material. The clinical team owns recommendations and
 * educational text; the triage model is in lib/triage.
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
