import type { Concern, Recommendation } from "@/lib/types/clinical";

/**
 * English clinical wording: concerns, safety message and next-step guidance.
 * Everything here is DRAFT text from the product brief and needs clinical review
 * before public deployment.
 */

export const concerns: Concern[] = [
  { id: "lump-or-swelling", label: "Lump or swelling", pathwayId: "lump-or-swelling" },
  { id: "pain-or-discomfort", label: "Breast pain or discomfort", pathwayId: null },
  { id: "size-or-shape", label: "Change in breast size or shape", pathwayId: null },
  { id: "skin-changes", label: "Skin changes", pathwayId: null },
  { id: "nipple-changes", label: "Nipple changes", pathwayId: null },
  { id: "nipple-discharge", label: "Nipple discharge", pathwayId: null },
  { id: "other-change", label: "Other unusual change", pathwayId: null },
  { id: "not-sure", label: "I'm not sure", pathwayId: null },
];

export const safetyMessage = {
  text: "This tool does not diagnose breast cancer. It helps you understand your responses and provides guidance on when to seek professional care.",
  review: { status: "draft", note: "Wording requires clinical review before public deployment." } as const,
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
