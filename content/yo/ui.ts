import type { UiText } from "@/content/en/ui";
import type { TranslationTable } from "@/lib/i18n/translate";
import type { ClinicalReview } from "@/lib/types/clinical";

/**
 * Yoruba interface text.
 *
 * PENDING: no Yoruba translations existed in the project when the language selector was
 * added, and none have been invented. Every key missing here is shown in English, and
 * the interface says so while Yoruba is selected. Run `npm test` to see the coverage
 * check, or call listMissingKeys(ui, uiYo) for the full list of keys to translate.
 *
 * To add translations: fill in keys with the same structure as content/en/ui.ts, then
 * set `uiYoReview` once a fluent reviewer has checked them. Any text with medical
 * meaning must be reviewed by the clinical lead before it is treated as final.
 */
export const uiYo: TranslationTable<UiText> = {
  language: {
    // Language names are written in their own language so speakers can find them.
    names: { en: "English", yo: "Yorùbá" },
  },
};

export const uiYoReview: ClinicalReview = {
  status: "draft",
  note: "No Yoruba interface text supplied yet.",
};
