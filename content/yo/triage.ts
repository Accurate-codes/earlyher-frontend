import type { TriageText } from "@/content/en/triage";
import type { TranslationTable } from "@/lib/i18n/translate";
import type { ClinicalReview } from "@/lib/types/clinical";

/**
 * Yoruba wording for the breast-concern triage.
 *
 * PENDING: no reviewed Yoruba triage text exists yet, and none has been drafted here,
 * because this text carries clinical meaning. While it is missing, English is shown
 * with the visible "not translated yet" notice, and both languages run the same rules.
 *
 * To add translations: fill keys with the same structure as content/en/triage.ts,
 * have them checked by a fluent reviewer and the clinical lead, then set
 * `triageYoReview.status` to "approved". Until approved, nothing here is shown.
 */
export const triageYo: TranslationTable<TriageText> = {};

export const triageYoReview: ClinicalReview = {
  status: "draft",
  note: "No Yoruba triage text supplied yet. Needs language and clinical review before use.",
};
