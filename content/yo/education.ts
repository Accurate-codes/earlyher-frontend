import type { ClinicalReview } from "@/lib/types/clinical";

/**
 * Yoruba education cards, keyed by the module slug and card id in content/en/education.ts.
 * DRAFT: AI-assisted (2026-10-23) translation of English text that is itself awaiting
 * clinical review. A card field left out here is shown in English.
 */

interface CardTranslation {
  heading?: string;
  body?: string;
  points?: string[];
  callout?: string;
}

export interface EducationTranslation {
  intro?: { greeting?: string; prompt?: string };
  changesQuestion?: string;
  modules?: Record<string, { title?: string; summary?: string; cards?: Record<string, CardTranslation> }>;
  review: ClinicalReview;
}

export const educationYo: EducationTranslation = {
  intro: {
    greeting: "Ó dára gan-an. Mímọ ohun tó jẹ́ déédéé fún yín lè ràn yín lọ́wọ́ láti tètè ṣàkíyèsí ìyípadà.",
    prompt: "Kí lẹ fẹ́ kẹ́kọ̀ọ́ nípa rẹ̀?",
  },
  changesQuestion: "Ṣé ẹ ti ṣàkíyèsí èyíkéyìí nínú àwọn ìyípadà wọ̀nyí?",
  modules: {
    "know-your-breasts": {
      title: "Ẹ mọ ọmú yín",
      summary: "Ohun tó jẹ́ déédéé yàtọ̀ fún olúkúlùkù.",
      cards: {
        vary: { heading: "Olúkúlùkù yàtọ̀", body: "Ọmú máa ń yàtọ̀ láti ẹnì kan sí ẹnì kejì." },
        "life-stages": { heading: "Ọmú máa ń yípadà bí ọjọ́ orí ti ń lọ", body: "Ọmú lè yípadà ní onírúurú ìpele ayé." },
        "normal-for-you": { heading: "Ẹ mọ ohun tó jẹ́ déédéé fún yín", body: "Mímọ ohun tó jẹ́ déédéé fún yín lè ràn yín lọ́wọ́ láti ṣàkíyèsí ìyípadà." },
        attention: { heading: "Ẹ ṣàkíyèsí ohun tó jẹ́ tuntun", body: "Ìyípadà tuntun tàbí èyí tí kò wọ́pọ̀ yẹ fún àkíyèsí." },
      },
    },
    "changes-to-look-out-for": {
      title: "Àwọn ìyípadà tí ẹ ó máa ṣọ́",
      summary: "Àwọn ìyípadà tó yẹ kí wọ́n ṣàyẹ̀wò.",
      cards: {
        changes: {
          heading: "Àwọn ìyípadà tí ẹ ó máa ṣọ́",
          points: [
            "Kókó tuntun tàbí wíwú",
            "Ìyípadà nínú bí ọmú ṣe tóbi tó tàbí bí ó ṣe rí",
            "Ìyípadà awọ ara",
            "Ìyípadà orí ọmú",
            "Omi tí kò wọ́pọ̀ tó ń jáde láti orí ọmú",
            "Ìnira ọmú tí kò lọ tàbí tí kò wọ́pọ̀",
            "Ìyípadà míì sí ohun tó jẹ́ déédéé fún yín",
          ],
        },
        noticed: { body: "Tí ẹ bá ti ṣàkíyèsí, a lè béèrè ìbéèrè díẹ̀ láti ràn yín lọ́wọ́ láti rí ìgbésẹ̀ yín tó kàn." },
      },
    },
    "healthy-breast-habits": {
      title: "Àwọn ìwà rere fún ìlera ọmú",
      summary: "Àwọn ìwà tí kò ṣòro tí ó ń ràn yín lọ́wọ́ láti máa ṣọ́ra.",
      cards: {
        "know-and-notice": { heading: "Ẹ mọ̀, kí ẹ sì ṣàkíyèsí", points: ["Ẹ mọ ohun tó jẹ́ déédéé fún yín.", "Ẹ máa ṣàkíyèsí ìyípadà."] },
        history: { heading: "Ẹ mọ ìtàn ìlera yín", body: "Ẹ lóye ìtàn ìlera ara yín àti ti ìdílé yín tó ṣe pàtàkì." },
        advice: {
          heading: "Ẹ béèrè lọ́wọ́ akọ́ṣẹ́mọṣẹ́",
          points: [
            "Ẹ gba ìmọ̀ràn akọ́ṣẹ́mọṣẹ́ nípa ìyípadà tuntun tàbí èyí tí kò lọ.",
            "Ẹ tẹ̀lé ìmọ̀ràn àyẹ̀wò tó bá ọjọ́ orí yín, ewu yín àti ibi tí ẹ ń gbé mu, gẹ́gẹ́ bí akọ́ṣẹ́mọṣẹ́ tó ní ìwé-ẹ̀rí ṣe gbà yín nímọ̀ràn.",
          ],
        },
      },
    },
    "when-to-see-a-healthcare-professional": {
      title: "Ìgbà tí ẹ ó rí òṣìṣẹ́ ìlera",
      summary: "Ìgbà tí ẹ ó béèrè fún àyẹ̀wò.",
      cards: {
        speak: {
          heading: "Ẹ bá òṣìṣẹ́ ìlera sọ̀rọ̀",
          body: "Tí ẹ bá ṣàkíyèsí ìyípadà tuntun tàbí èyí tí kò wọ́pọ̀ nínú ọmú yín, ó ṣe pàtàkì láti bá òṣìṣẹ́ ìlera sọ̀rọ̀.",
        },
        examine: {
          heading: "Ohun tí wọ́n lè ṣe",
          body: "Wọ́n lè ṣàyẹ̀wò yín, kí wọ́n sì pinnu bóyá ẹ nílò àyẹ̀wò tàbí ìdánwò míì.",
        },
      },
    },
  },
  review: {
    status: "draft",
    note: "AI-assisted draft translation (2026-10-23) of English education text that is itself pending clinical review.",
  },
};
