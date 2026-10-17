import type { Recommendation } from "@/lib/types/clinical";

/**
 * English clinical wording: the disclaimer and draft next-step guidance.
 * Everything except the disclaimer is DRAFT text from the product brief and needs
 * clinical review before public deployment.
 */

/** The disclaimer shown beneath the questionnaire and on the next-steps screen. Wording supplied verbatim. */
export const safetyMessage = {
  text: "This tool does not diagnose. It helps you understand your symptoms and connects you to professional care as fast as possible.",
  review: {
    status: "approved",
    reviewedBy: "EarlyHer project team (exact wording supplied)",
    reviewedOn: "2026-10-17",
  } as const,
};

export const recommendations: Record<string, Recommendation> = {
  "speak-to-professional": {
    id: "speak-to-professional",
    text: "Based on the information you provided, we recommend speaking with a healthcare professional about this change.",
    // Composed only from sentences supplied in the brief's education content.
    why: "If you notice a new or unusual change in your breast, it is important to speak with a healthcare professional. They can examine you and decide whether you need further assessment or tests.",
    review: {
      status: "draft",
      note: "Draft guidance from the product brief. Not a clinically validated personalised result.",
    },
  },
};

/** Shown when a concern has no question pathway yet. Supplied education wording, used as general guidance. */
export const generalGuidance = {
  text: "A new or unusual change should be checked by a healthcare professional.",
  review: { status: "draft", note: "Supplied education wording used as general guidance. Requires clinical review." } as const,
};

export function getRecommendation(id: string | null | undefined): Recommendation | null {
  return (id && recommendations[id]) || null;
}
