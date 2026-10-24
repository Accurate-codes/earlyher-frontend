import { safetyMessage } from "@/content/en/clinical";
import { changesQuestion, educationIntro, educationModules } from "@/content/en/education";
import { triageText, type TriageText } from "@/content/en/triage";
import { ui, type UiText } from "@/content/en/ui";
import { safetyMessageYo } from "@/content/yo/clinical";
import { educationYo, type EducationTranslation } from "@/content/yo/education";
import { triageYo, triageYoReview } from "@/content/yo/triage";
import { uiYo, uiYoReview } from "@/content/yo/ui";
import type { ClinicalReview, EducationModule } from "@/lib/types/clinical";
import type { Locale } from "@/lib/types/locale";
import { countLeaves, listMissingKeys, mergeTranslations } from "./translate";
import { fitTable } from "./yoruba";

/**
 * All user-facing text for one language, with English filling any gap. Pure (no React),
 * so the screens, the speech catalogue and the speech server all read the same text.
 *
 * Both languages share question ids, option ids, branching and rules; only wording
 * changes. Yoruba wording is a draft until a fluent reviewer and the clinical lead
 * approve it, and the interface says so while Yoruba is selected.
 */

export interface Education {
  intro: { greeting: string; prompt: string };
  changesQuestion: string;
  modules: EducationModule[];
}

export interface LocaleContent {
  locale: Locale;
  ui: UiText;
  triage: TriageText;
  education: Education;
  safetyText: string;
}

/** The interface-test panel is for staff in development builds and stays in English. */
const STAFF_ONLY = ["dev"] as const;

function localizeEducation(table: EducationTranslation): Education {
  return {
    intro: { ...educationIntro, ...table.intro },
    changesQuestion: table.changesQuestion ?? changesQuestion,
    modules: educationModules.map((topic) => {
      const t = table.modules?.[topic.slug];
      return {
        ...topic,
        title: t?.title ?? topic.title,
        summary: t?.summary ?? topic.summary,
        cards: topic.cards.map((card) => {
          const c = t?.cards?.[card.id];
          const heading = card.askAboutChanges ? (table.changesQuestion ?? card.heading) : (c?.heading ?? card.heading);
          return {
            ...card,
            heading,
            body: c?.body ?? card.body,
            points: c?.points ?? card.points,
            callout: c?.callout ?? card.callout,
          };
        }),
      };
    }),
  };
}

const english: LocaleContent = {
  locale: "en",
  ui,
  triage: triageText,
  education: { intro: educationIntro, changesQuestion, modules: educationModules },
  safetyText: safetyMessage.text,
};

const yoruba: LocaleContent = {
  locale: "yo",
  ui: { ...mergeTranslations(ui, fitTable(uiYo)), dev: ui.dev },
  triage: mergeTranslations(triageText, fitTable(triageYo)),
  education: localizeEducation(fitTable(educationYo)),
  safetyText: safetyMessageYo.text ? fitTable(safetyMessageYo.text) : safetyMessage.text,
};

export function contentFor(locale: Locale): LocaleContent {
  return locale === "yo" ? yoruba : english;
}

/** Education text that has no Yoruba yet, as dotted ids like the speech catalogue uses. */
function missingEducation(): string[] {
  const missing: string[] = [];
  if (!educationYo.intro?.greeting) missing.push("learn.intro.greeting");
  if (!educationYo.intro?.prompt) missing.push("learn.intro.prompt");
  if (!educationYo.changesQuestion) missing.push("learn.changesQuestion");
  for (const topic of educationModules) {
    const t = educationYo.modules?.[topic.slug];
    if (!t?.title) missing.push(`learn.${topic.slug}.title`);
    if (!t?.summary) missing.push(`learn.${topic.slug}.summary`);
    for (const card of topic.cards) {
      const c = t?.cards?.[card.id];
      for (const field of ["heading", "body", "points", "callout"] as const) {
        if (field === "heading" && card.askAboutChanges) continue;
        if (card[field] !== undefined && c?.[field] === undefined) missing.push(`learn.${topic.slug}.${card.id}.${field}`);
      }
    }
  }
  return missing;
}

export interface TranslationStatus {
  /** Texts still shown in English, as dotted ids. */
  missing: string[];
  total: number;
  /** True until every Yoruba file has passed language and clinical review. */
  draft: boolean;
  reviews: Record<string, ClinicalReview>;
}

export function yorubaStatus(): TranslationStatus {
  const uiBase = Object.fromEntries(Object.entries(ui).filter(([key]) => !(STAFF_ONLY as readonly string[]).includes(key)));
  const missing = [
    ...listMissingKeys(uiBase, uiYo).map((key) => `ui.${key}`),
    ...listMissingKeys(triageText, triageYo).map((key) => `triage.${key}`),
    ...missingEducation(),
    ...(safetyMessageYo.text ? [] : ["safety.text"]),
  ];
  const reviews = {
    "content/yo/ui.ts": uiYoReview,
    "content/yo/triage.ts": triageYoReview,
    "content/yo/education.ts": educationYo.review,
    "content/yo/clinical.ts": safetyMessageYo.review,
  };
  return {
    missing,
    total: countLeaves(uiBase) + countLeaves(triageText),
    draft: Object.values(reviews).some((review) => review.status !== "approved"),
    reviews,
  };
}
