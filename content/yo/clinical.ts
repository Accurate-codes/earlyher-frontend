import type { ClinicalReview } from "@/lib/types/clinical";

/**
 * Yoruba disclaimer. The English wording (content/en/clinical.ts) was supplied verbatim
 * and approved; this translation is a DRAFT and is marked as such on screen until a
 * fluent reviewer and the clinical lead approve it.
 */
export const safetyMessageYo: { text?: string; review: ClinicalReview } = {
  text: "Ètò yìí kì í dá àìsàn mọ̀. Ó ń ràn yín lọ́wọ́ láti lóye àwọn àmì tí ẹ ní, ó sì ń so yín pọ̀ mọ́ ìtọ́jú lọ́wọ́ akọ́ṣẹ́mọṣẹ́ ní kíákíá bí ó ti ṣeé ṣe.",
  review: {
    status: "draft",
    note: "AI-assisted draft translation of the approved English disclaimer (2026-10-23). Needs language and clinical review.",
  },
};
