import type { TriageText } from "@/content/en/triage";
import type { TranslationTable } from "@/lib/i18n/translate";
import type { ClinicalReview } from "@/lib/types/clinical";

/**
 * Yoruba wording for the breast-concern triage: same keys as content/en/triage.ts.
 *
 * DRAFT, NOT CLINICALLY APPROVED. Written on 2026-10-23 with an AI assistant. It must be
 * checked by a fluent Yoruba speaker and by the clinical lead before real use; until
 * `triageYoReview.status` is "approved" the app shows a "draft translation" notice while
 * Yoruba is selected. docs/yoruba-review.md lists the terms and choices to check first.
 *
 * Rules, question ids and answer ids are shared with English, so the same answers always
 * give the same result in both languages. Only the words below change.
 *
 * To correct wording: edit the text between the quotes. Keep the key names (the words
 * before the colons) and the ${...} placeholders. Keep tone marks and ẹ, ọ, ṣ. Never
 * change the meaning of a timeframe ("today", "within 1 week", "within 4 weeks").
 * After editing, run `npm test`, and `npm run audio:status -- yo` if recordings exist.
 */

const yesNo = { yes: "Bẹ́ẹ̀ ni", no: "Rárá" } as const;
const yesNoUnknown = { yes: "Bẹ́ẹ̀ ni", no: "Rárá", unknown: "Mi ò mọ̀" } as const;

const quadrants = {
  upperOuter: "Òkè, ní ẹ̀gbẹ́ abíyá",
  upperInner: "Òkè, ní ẹ̀gbẹ́ àárín àyà",
  lowerOuter: "Ìsàlẹ̀, ní ẹ̀gbẹ́ abíyá",
  lowerInner: "Ìsàlẹ̀, ní ẹ̀gbẹ́ àárín àyà",
  nipple: "Lẹ́yìn orí ọmú",
  unsure: "Mi ò dá mi lójú",
} as const;

export const triageYo: TranslationTable<TriageText> = {
  welcome: {
    concernTitle: "Ẹ jẹ́ kí a jọ wo ìdààmú yín nípa ọmú",
    noConcernTitle: "Ẹ jẹ́ kí a jọ ṣàyẹ̀wò ọmú yín",
    body: "Ẹ dáhùn àwọn ìbéèrè díẹ̀ tí kò ṣòro. Ní ìparí, a ó ṣàlàyé bí ó ṣe yẹ kí ẹ tètè wá ìtọ́jú tó, a ó sì fi ìgbésẹ̀ yín tó kàn hàn yín.",
    consent:
      "Tí ẹ bá tẹ̀síwájú, ẹ gbà pé EarlyHer lè lo àwọn ìdáhùn yín láti tọ́ yín sọ́nà, àti pé, tí ẹ bá fẹ́ nìkan, ẹ lè fi wọ́n han dókítà.",
    privacyLink: "Ẹ ka bí EarlyHer ṣe ń bójú tó àwọn ìdáhùn yín",
    agree: "Mo gbà, ẹ jẹ́ ká bẹ̀rẹ̀",
    continue: "Tẹ̀síwájú",
    emergency: "Ṣé àyà ń dùn yín, tàbí ẹ ò lè mí dáadáa? Ẹ pe nọ́mbà pàjáwìrì àdúgbò yín báyìí.",
    emergencyCall: (number: string) => `Pe ${number}`,
    resumeTitle: "Ẹ ní ìlọsíwájú tí ẹ fi pamọ́ sórí ẹ̀rọ yìí",
    resumeText: "Ẹ lè tẹ̀síwájú láti ibi tí ẹ dé, tàbí kí ẹ bẹ̀rẹ̀ lẹ́ẹ̀kan sí i. Bíbẹ̀rẹ̀ lẹ́ẹ̀kan sí i yóò pa àwọn ìdáhùn tí ẹ fi pamọ́ rẹ́.",
    resume: "Tẹ̀síwájú láti ibi tí mo dé",
    startAgain: "Bẹ̀rẹ̀ lẹ́ẹ̀kan sí i",
    noIdentity: "A kò ní béèrè orúkọ yín, nọ́mbà fóònù yín tàbí ímeèlì yín.",
  },

  stages: {
    about: "Nípa yín",
    safety: "Àyẹ̀wò ààbò",
    symptom: "Àmì tí ẹ ní",
    history: "Ìtàn ìlera yín",
  },
  stageProgress: (current: string, position: number, total: number) => `${current}. Apá ${position} nínú ${total}.`,
  stagesLabel: "Ìlọsíwájú",
  stageDone: "ti parí",
  stageCurrent: "ibi tí ẹ wà",

  nav: {
    continue: "Tẹ̀síwájú",
    back: "Padà sẹ́yìn",
    chooseOne: "Ẹ yan ìdáhùn kan.",
    chooseAll: "Ẹ yan gbogbo èyí tó bá kàn yín.",
    required: "Ẹ jọ̀wọ́ ẹ yan ìdáhùn kan kí ẹ tó tẹ̀síwájú.",
    requiredMulti: "Ẹ jọ̀wọ́ ẹ yan ó kéré tán ìdáhùn kan kí ẹ tó tẹ̀síwájú.",
    requiredFollowUp: "Ẹ jọ̀wọ́ ẹ dáhùn apá méjèèjì kí ẹ tó tẹ̀síwájú.",
    optional: "Kò pọn dandan",
    switchToConcern: "Mo ní ìdààmú",
    switchToConcernText: "Ṣé ẹ ti ṣàkíyèsí nǹkan kan?",
    questionAnnouncement: (stage: string, prompt: string) => `${stage}: ${prompt}`,
  },

  footer: {
    text: "Ìtọ́sọ́nà ni èyí, kì í ṣe ìdámọ̀ àìsàn. Tí ọkàn yín kò bá balẹ̀ nígbàkigbà, ẹ lè lọ gba ìtọ́jú.",
    findCare: "Wá ìtọ́jú",
  },

  helpNow: {
    button: "Mo nílò ìrànlọ́wọ́ báyìí",
    title: "Ẹ gba ìrànlọ́wọ́ báyìí",
    text: "Tí ara yín kò bá yá rárá, tàbí tí ọkàn yín kò bá balẹ̀ nípa ọmú yín báyìí, ẹ má ṣe dúró. Ẹ rí dókítà lónìí, tàbí kí ẹ lọ sí ibi ìtọ́jú pàjáwìrì tó súnmọ́ yín jù.",
    emergency: "Tí ẹ kò bá lè mí dáadáa tàbí tí àyà bá ń dùn yín, ẹ pe nọ́mbà pàjáwìrì àdúgbò yín lẹ́sẹ̀kẹsẹ̀.",
    findCare: "Wá ìtọ́jú nítòsí mi báyìí",
    talk: "Bá òṣìṣẹ́ ìlera sọ̀rọ̀ báyìí",
    back: "Padà sí àwọn ìbéèrè mi",
    kept: "A ó pa àwọn ìdáhùn yín mọ́ tí ẹ bá padà wá.",
  },

  questions: {
    Q1: {
      prompt: "Kí ló mú yín wá lónìí?",
      summary: "Ìdí tí ẹ fi wá",
      options: {
        A: "Mo rí kókó tàbí ibi tó ki",
        B: "Omi ń jáde láti orí ọmú mi",
        C: "Ọmú mi ń dùn mí",
        D: "Awọ ara tàbí orí ọmú mi yàtọ̀ sí bí ó ti máa ń rí",
        N: "Mi ò ní ìdààmú. Mo kàn fẹ́ ṣàyẹ̀wò ni",
      },
    },
    Q1b: {
      prompt: "Ọmọ ọdún mélòó ni yín?",
      summary: "Ọjọ́ orí",
      options: {
        under25: "Kò tíì tó ọdún 25",
        "25to39": "Ọdún 25 sí 39",
        "40to49": "Ọdún 40 sí 49",
        "50to69": "Ọdún 50 sí 69",
        "70plus": "Ọdún 70 tàbí jù bẹ́ẹ̀ lọ",
      },
    },
    N1: {
      prompt: "Ṣé ẹ máa ń fúnra yín ṣàyẹ̀wò ọmú yín?",
      summary: "Ó máa ń ṣàyẹ̀wò ọmú ara rẹ̀",
      options: { monthly: "Lóṣooṣù", sometimes: "Lẹ́ẹ̀kọ̀ọ̀kan", never: "Rárá, mi ò ṣe é rí" },
    },
    N2: {
      prompt: "Ṣé ẹ rí ìyípadà kankan nínú ọmú yín?",
      helper:
        "Ẹ dúró níwájú dígí. Ẹ wò ó pẹ̀lú apá yín ní ẹ̀gbẹ́ yín. Lẹ́yìn náà, ẹ tẹ ọwọ́ yín mọ́ ìbàdí yín. Lẹ́yìn náà, ẹ gbé apá yín sókè lórí yín. Ẹ wá ihò kékeré tàbí awọ tó ká jọ, pípọ́n, orí ọmú tó wọnú, tàbí ọmú kan tó yàtọ̀ sí èkejì.",
      summary: "Ìyípadà tí ó rí nínú dígí",
      options: { normal: "Rárá, gbogbo rẹ̀ rí bí ó ti máa ń rí", change: "Bẹ́ẹ̀ ni, mo rí ìyípadà", unsure: "Mi ò dá mi lójú" },
    },
    N3: {
      prompt: "Ṣé ẹ fọwọ́ kan kókó tàbí ibi tó ki?",
      helper:
        "Ẹ dùbúlẹ̀ pẹ̀lú apá kan lókè orí yín. Ẹ lo inú àwọn ìka àárín mẹ́ta. Ẹ tẹ̀ ẹ́ ní àyíká kékeré, láti orí ọmú títí dé etí ọmú, kí ẹ sì gòkè lọ sí abíyá. Ẹ ṣe é ní ẹ̀gbẹ́ méjèèjì. Ẹ tẹ̀ ẹ́ jẹ́jẹ́ ná, lẹ́yìn náà ẹ tẹ̀ ẹ́ díẹ̀ sí i.",
      summary: "Kókó tàbí ibi tó ki tí ó fọwọ́ kàn",
      options: {
        normal: "Rárá, kò sí ohun tó yàtọ̀",
        something: "Bẹ́ẹ̀ ni, mo fọwọ́ kan nǹkan kan",
        unsure: "Mi ò dá mi lójú",
        later: "Màá ṣe é nígbà míì",
      },
    },
    N4: {
      prompt: "Ìgbà wo ni òṣìṣẹ́ ìlera ṣàyẹ̀wò ọmú yín kẹ́yìn?",
      summary: "Ìgbà tí òṣìṣẹ́ ìlera ṣàyẹ̀wò ọmú rẹ̀ kẹ́yìn",
      options: {
        lastYear: "Láàárín ọdún kan sẹ́yìn",
        "1to2years": "Ọdún 1 sí 2 sẹ́yìn",
        over2years: "Ó ju ọdún 2 lọ",
        never: "Kò ṣẹlẹ̀ rí",
        dontRemember: "Mi ò rántí",
      },
    },
    R1: {
      prompt: "Ṣé ẹ ní ibà tàbí òtútù tó ń mú yín gbọ̀n báyìí?",
      helper: "Ibà ni kí ìwọ̀n ooru ara yín jẹ́ 38°C (100.4°F) tàbí jù bẹ́ẹ̀ lọ, tàbí kí ara yín gbóná kí ẹ sì máa gbọ̀n.",
      summary: "Ibà tàbí òtútù",
      options: { yes: "Bẹ́ẹ̀ ni", no: "Rárá", feverish: "Mi ò tíì wọ̀n ọ́n, ṣùgbọ́n ara mi gbóná bí ibà" },
    },
    R2: {
      prompt: "Ṣé apá kan ọmú yín pọ́n, gbóná, wú, tàbí ń dùn yín gidigidi?",
      summary: "Apá kan tó pọ́n, gbóná, wú tàbí ń dùn gidigidi",
      options: { recent: "Bẹ́ẹ̀ ni, ó bẹ̀rẹ̀ láàárín ọjọ́ díẹ̀ sẹ́yìn", weeks: "Bẹ́ẹ̀ ni, ó ti wà fún ọ̀sẹ̀ mélòó kan", no: "Rárá" },
    },
    R3: {
      prompt: "Ṣé ẹ lóyún tàbí ẹ ń fún ọmọ lọ́mú?",
      helper: "Ẹ ka èyí kún un tí ẹ bá dá fífún ọmọ lọ́mú dúró láàárín oṣù 12 sẹ́yìn.",
      summary: "Oyún tàbí fífún ọmọ lọ́mú",
      options: {
        pregnant: "Mo lóyún",
        breastfeeding: "Mo ń fún ọmọ lọ́mú",
        stopped: "Mo dá fífún ọmọ lọ́mú dúró láàárín oṣù 12 sẹ́yìn",
        none: "Kò sí èyíkéyìí nínú wọn",
      },
    },
    R4: {
      prompt: "Láàárín oṣù kan sẹ́yìn, ṣé ẹ ti ní èyíkéyìí nínú ìwọ̀nyí?",
      summary: "Àwọn ìyípadà míì láàárín oṣù kan sẹ́yìn",
      options: {
        weightLoss: "Ara mi ń rù, mi ò sì mọ ìdí rẹ̀",
        bonePain: "Egungun ń dùn mí",
        headaches: "Orí fífọ́ tí kò lọ",
        vision: "Ìyípadà nínú ìríran mi",
        none: "Kò sí èyíkéyìí nínú wọn",
      },
    },
    R5: {
      prompt: "Ṣé nǹkan gbá yín ní àyà tàbí ẹ fara pa ní àyà láìpẹ́ yìí?",
      summary: "Ìfarapa tàbí ìgbámú ní àyà",
      options: { recent: "Bẹ́ẹ̀ ni, láàárín ọ̀sẹ̀ 2 sẹ́yìn", earlier: "Bẹ́ẹ̀ ni, ó ju ọ̀sẹ̀ 2 lọ", no: "Rárá" },
    },
    A1: {
      prompt: "Ẹ̀gbẹ́ wo ni kókó náà wà?",
      summary: "Ẹ̀gbẹ́",
      options: { right: "Ọmú ọ̀tún", left: "Ọmú òsì", both: "Ọmú méjèèjì", armpit: "Ní abíyá mi tàbí nítòsí rẹ̀" },
    },
    A2R: {
      prompt: "Apá ibo nínú ọmú ọ̀tún yín ló wà?",
      helper: "Ẹ̀gbẹ́ abíyá ni ẹ̀gbẹ́ tó jìnnà sí àárín àyà. Ẹ yan án lórí àwòrán tàbí nínú àkójọ.",
      summary: "Ibi tó wà nínú ọmú ọ̀tún",
      options: quadrants,
    },
    A2L: {
      prompt: "Apá ibo nínú ọmú òsì yín ló wà?",
      helper: "Ẹ̀gbẹ́ abíyá ni ẹ̀gbẹ́ tó jìnnà sí àárín àyà. Ẹ yan án lórí àwòrán tàbí nínú àkójọ.",
      summary: "Ibi tó wà nínú ọmú òsì",
      options: quadrants,
    },
    A3: {
      prompt: "Ìgbà wo lẹ kọ́kọ́ ṣàkíyèsí rẹ̀?",
      summary: "Ìgbà tí ó kọ́kọ́ ṣàkíyèsí rẹ̀",
      options: {
        lt1week: "Kò tíì tó ọ̀sẹ̀ 1",
        "1to2weeks": "Ọ̀sẹ̀ 1 sí 2 sẹ́yìn",
        gt2weeks: "Ó ju ọ̀sẹ̀ 2 lọ",
        gt1month: "Ó ju oṣù kan lọ",
      },
    },
    A4: {
      prompt: "Ṣé ó ti yípadà láti ìgbà tí ẹ kọ́kọ́ ṣàkíyèsí rẹ̀?",
      summary: "Ìyípadà láti ìgbà tí ó kọ́kọ́ ṣàkíyèsí rẹ̀",
      options: { bigger: "Ó ti tóbi sí i", different: "Ó ti yàtọ̀ nígbà tí mo bá fọwọ́ kàn án", same: "Bákan náà ló ṣì wà", smaller: "Ó ti kéré sí i" },
    },
    A5: {
      prompt: "Ṣé kókó náà máa ń tóbi sí i tàbí máa ń dùn yín kí nǹkan oṣù yín tó dé, tí ó sì máa ń rọlẹ̀ lẹ́yìn rẹ̀?",
      summary: "Ìyípadà pẹ̀lú nǹkan oṣù",
      options: { yes: "Bẹ́ẹ̀ ni", no: "Rárá", noPeriods: "Mi ò kí í ṣe nǹkan oṣù", unsure: "Mi ò dá mi lójú" },
    },
    A6: {
      prompt: "Báwo ni kókó náà ṣe rí nígbà tí ẹ bá fọwọ́ kàn án?",
      helper: "Ẹ tẹ̀ ẹ́ jẹ́jẹ́. Ohun tó rọ̀ dà bí ẹ̀yìn etí yín. Ohun tó le díẹ̀ dà bí orí imú yín. Ohun tó le gan-an dà bí iwájú orí yín.",
      summary: "Bí ó ṣe rí nígbà tí a fọwọ́ kàn án",
      options: { soft: "Ó rọ̀", rubbery: "Ó dà bí rọ́bà", firm: "Ó le díẹ̀", hard: "Ó le bí òkúta", unsure: "Mi ò dá mi lójú" },
    },
    A7: {
      prompt: "Báwo ni etí kókó náà ṣe rí?",
      helper: "Ṣé ẹ lè tọpasẹ̀ etí rẹ̀ kedere, bí ti ọmọ ayò, àbí ó dàpọ̀ mọ́ ẹran ara tó yí i ká?",
      summary: "Etí rẹ̀",
      options: { smooth: "Ó dán, etí rẹ̀ sì hàn kedere", uneven: "Kò dọ́gba, ó ṣòro láti tọpasẹ̀", unsure: "Mi ò dá mi lójú" },
    },
    A8: {
      prompt: "Tí ẹ bá tẹ̀ ẹ́, ṣé ó máa ń sún kiri lábẹ́ ìka yín?",
      summary: "Ṣé ó ń sún",
      options: { moves: "Ó ń sún kiri dáadáa", stuck: "Ó dà bí ẹni pé ó lẹ̀ mọ́ ibì kan", unsure: "Mi ò dá mi lójú" },
    },
    A9: {
      prompt: "Ṣé ẹ ti ní kókó nínú ọmú rí, tàbí kí wọ́n fa omi inú àpò omi (cyst) jáde, tàbí kí wọ́n mú díẹ̀ nínú ẹran ara ọmú fún àyẹ̀wò (biopsy)?",
      summary: "Kókó tẹ́lẹ̀, àpò omi tí wọ́n fà jáde, tàbí biopsy",
      options: {
        harmless: "Bẹ́ẹ̀ ni, wọ́n sì sọ fún mi pé kò léwu",
        unknownResult: "Bẹ́ẹ̀ ni, ṣùgbọ́n mi ò mọ èsì rẹ̀",
        no: "Rárá",
      },
    },
    B1: {
      prompt: "Ṣé omi náà máa ń dá jáde fúnra rẹ̀?",
      helper: "Fún àpẹẹrẹ, ṣé ó máa ń ba kọ̀mù (bra) tàbí aṣọ alẹ́ yín jẹ́ láìjẹ́ pé ẹ fọwọ́ kan ọmú yín?",
      summary: "Ó ń dá jáde fúnra rẹ̀",
      options: { yes: "Bẹ́ẹ̀ ni, ó ń dá jáde fúnra rẹ̀", squeeze: "Nígbà tí mo bá fún un tàbí tẹ̀ ẹ́ nìkan", unsure: "Mi ò dá mi lójú" },
    },
    B2: {
      prompt: "Ṣé omi náà ń jáde láti ọmú kan ni, àbí méjèèjì?",
      summary: "Ọmú kan tàbí méjèèjì",
      options: { one: "Ọmú kan", both: "Ọmú méjèèjì" },
    },
    B2side: {
      prompt: "Ọmú wo?",
      summary: "Ọmú wo",
      options: { right: "Ọ̀tún", left: "Òsì" },
    },
    B3: {
      prompt: "Ṣé omi náà ń jáde láti ihò kékeré kan ṣoṣo, àbí láti ọ̀pọ̀lọpọ̀ ihò?",
      helper: "Orí ọmú ní ọ̀pọ̀lọpọ̀ ihò kéékèèké. Omi lè máa jáde láti ọ̀kan ṣoṣo nínú wọn, tàbí láti ọ̀pọ̀.",
      summary: "Àwọn ihò",
      options: { one: "Ihò kan", several: "Ọ̀pọ̀lọpọ̀ ihò", cantTell: "Mi ò lè mọ̀" },
    },
    B4: {
      prompt: "Àwọ̀ wo ni omi náà ní?",
      summary: "Àwọ̀",
      options: {
        clear: "Ó mọ́ gaara bí omi",
        pink: "Àwọ̀ pupa rúsúrúsú (pink)",
        bloody: "Ẹ̀jẹ̀ tàbí pupa",
        milky: "Ó funfun bí wàrà",
        coloured: "Ewé, òféèfé, àwọ̀ ilẹ̀ (brown), tàbí ó ki",
      },
    },
    B5: {
      prompt: "Ṣé ẹ tún ní kókó, ibi tó ki, tàbí ìyípadà ní orí ọmú yín?",
      summary: "Kókó, ibi tó ki tàbí ìyípadà orí ọmú pẹ̀lú",
      options: yesNo,
    },
    B6: {
      prompt: "Pẹ̀lú omi náà, ṣé ẹ ti ní orí fífọ́ tí kò lọ, ìyípadà nínú ìríran yín, tàbí kí nǹkan oṣù yín má wá?",
      summary: "Orí fífọ́, ìyípadà ìríran tàbí nǹkan oṣù tí kò wá",
      options: { yes: "Bẹ́ẹ̀ ni", no: "Rárá", noPeriods: "Mi ò kí í ṣe nǹkan oṣù" },
    },
    B6b: {
      prompt: "Ṣé ẹ ti ní orí fífọ́ tí kò lọ, tàbí ìyípadà nínú ìríran yín?",
      summary: "Orí fífọ́ tàbí ìyípadà ìríran",
      options: yesNo,
    },
    B7: {
      prompt: "Ṣé ẹ ń lo èyíkéyìí nínú àwọn oògùn wọ̀nyí?",
      summary: "Àwọn oògùn",
      options: {
        antidepressants: "Oògùn fún ìrẹ̀wẹ̀sì ọkàn tàbí fún ìṣesí",
        antipsychotics: "Oògùn fún àìsàn ọpọlọ (antipsychotic)",
        bloodPressure: "Oògùn ẹ̀jẹ̀ ríru",
        hormones: "Oògùn ìdènà oyún tàbí oògùn hómónù",
        strongPainkillers: "Oògùn apàrora tó lágbára bí codeine tàbí morphine",
        antacids: "Oògùn fún ọkàn tó ń jóná tàbí ásíìdì inú",
        none: "Kò sí èyíkéyìí nínú wọn",
        unsure: "Mi ò dá mi lójú",
      },
    },
    B8: {
      prompt: "Ṣé àyíká orí ọmú yín pọ́n, gbóná, tàbí ń dùn yín gidigidi?",
      summary: "Àyíká orí ọmú pọ́n, gbóná tàbí ń dùn gidigidi",
      options: yesNo,
    },
    C1: {
      prompt: "Ṣé ìrora náà máa ń wá, tí ó sì máa ń lọ pẹ̀lú nǹkan oṣù yín?",
      helper: "Ọ̀pọ̀ ènìyàn máa ń ní ìrora tàbí ìwúwo nínú ọmú kí nǹkan oṣù tó dé, tí ó sì máa ń rọlẹ̀ nígbà tí ó bá bẹ̀rẹ̀.",
      summary: "Ó ń wá, ó sì ń lọ pẹ̀lú nǹkan oṣù",
      options: { yes: "Bẹ́ẹ̀ ni", no: "Rárá", noPeriods: "Mi ò kí í ṣe nǹkan oṣù" },
    },
    C2: {
      prompt: "Ibo ni ìrora náà wà?",
      summary: "Ibo",
      options: { both: "Ní ọmú méjèèjì", oneBreast: "Ní gbogbo ara ọmú kan", oneSpot: "Ní ibì kékeré kan" },
    },
    C3: {
      prompt: "Báwo ni ìrora náà ṣe le tó?",
      summary: "Bí ó ṣe le tó",
      options: { mild: "Díẹ̀, 0 sí 3", medium: "Àárín, 4 sí 6", strong: "Ó le gan-an, 7 sí 10" },
    },
    C3b: {
      prompt: "Ṣé ó ń dí yín lọ́wọ́ láti sùn tàbí láti ṣe iṣẹ́ ojoojúmọ́ yín?",
      summary: "Ó ń dí oorun tàbí iṣẹ́ ojoojúmọ́ lọ́wọ́",
      options: yesNo,
    },
    C4: {
      prompt: "Ó ti tó ìgbà wo tí ìrora náà ti bẹ̀rẹ̀?",
      summary: "Bí ó ti pẹ́ tó",
      options: { lt2weeks: "Kò tíì tó ọ̀sẹ̀ 2", "2to6weeks": "Ọ̀sẹ̀ 2 sí 6", gt6weeks: "Ó ju ọ̀sẹ̀ 6 lọ" },
    },
    C5: {
      prompt: "Ṣé ìrora náà máa ń tàn dé abíyá yín, apá yín, tàbí àyà yín?",
      summary: "Ó ń tàn dé abíyá, apá tàbí àyà",
      options: yesNo,
    },
    C6: {
      prompt: "Ṣé ibi tó ń dùn yín náà pọ́n, gbóná, tàbí wú?",
      summary: "Ibi tó ń dùn pọ́n, gbóná tàbí wú",
      options: yesNo,
    },
    C7: {
      prompt: "Ṣé ẹ tún ní èyíkéyìí nínú ìwọ̀nyí?",
      summary: "Ohun míì tí ó ṣàkíyèsí",
      options: { A: "Kókó tàbí ibi tó ki", B: "Omi láti orí ọmú", D: "Ìyípadà nínú awọ ara tàbí orí ọmú", none: "Kò sí èyíkéyìí nínú wọn" },
    },
    D1: {
      prompt: "Àwọn ìyípadà wo lẹ rí tàbí ẹ fọwọ́ kàn?",
      summary: "Àwọn ìyípadà",
      options: {
        dimpling: "Ihò kéékèèké tàbí awọ tó ká jọ",
        orangePeel: "Awọ tó rí bí èèpo ọsàn, tàbí tó ki",
        redness: "Pípọ́n",
        swelling: "Wíwú, tàbí ọmú kan wúwo ju èkejì lọ",
        warm: "Ọmú náà gbóná",
        inversion: "Orí ọmú mi ṣẹ̀ṣẹ̀ yí wọnú tàbí fà wọlé",
        scaly: "Awọ tó ń bó, tó ní èépá, tàbí tó ń yún ní orí ọmú mi tàbí àyíká dúdú rẹ̀",
        none: "Kò sí èyíkéyìí nínú wọn",
      },
    },
    D2: {
      prompt: "Ó ti tó ìgbà wo tí ẹ ti ṣàkíyèsí rẹ̀?",
      summary: "Ìgbà tí ó ti ṣàkíyèsí rẹ̀",
      options: { lt1week: "Kò tíì tó ọ̀sẹ̀ 1", "1to4weeks": "Ọ̀sẹ̀ 1 sí 4", gt4weeks: "Ó ju ọ̀sẹ̀ 4 lọ" },
    },
    D3: {
      prompt: "Ṣé ó ń tàn kálẹ̀ tàbí ó ń burú sí i?",
      summary: "Ó ń tàn kálẹ̀ tàbí ó ń burú sí i",
      options: { yes: "Bẹ́ẹ̀ ni", no: "Rárá", unsure: "Mi ò dá mi lójú" },
    },
    D4: {
      prompt: "Ṣé orí ọmú yín ti máa ń wọnú láti ìgbà gbogbo?",
      summary: "Orí ọmú ti máa ń wọnú láti ìgbà gbogbo",
      options: { always: "Bẹ́ẹ̀ ni, láti ìgbà tí mo ti wà ní kékeré", new: "Rárá, tuntun ni" },
    },
    D5: {
      prompt: "Ṣé ẹ ní ẹ̀yi (eczema) tàbí awọ gbígbẹ níbòmíì lára yín, ṣé ó sì máa ń lọ tí ẹ bá fi ìpara sí i?",
      summary: "Ẹ̀yi (eczema) tàbí awọ gbígbẹ níbòmíì",
      options: {
        clears: "Bẹ́ẹ̀ ni, ó sì máa ń lọ pẹ̀lú ìpara",
        doesNotClear: "Bẹ́ẹ̀ ni, ṣùgbọ́n kò kí í lọ",
        noEczema: "Rárá, mi ò ní ẹ̀yi níbòmíì",
      },
    },
    D6: {
      prompt: "Ṣé ẹ tún ní kókó tàbí omi tó ń jáde láti orí ọmú?",
      summary: "Ohun míì tí ó ṣàkíyèsí",
      options: { A: "Kókó tàbí ibi tó ki", B: "Omi láti orí ọmú", none: "Kò sí èyíkéyìí nínú wọn" },
    },
    H1: {
      prompt: "Ṣé ìyá yín, ẹ̀gbọ́n tàbí àbúrò yín obìnrin, tàbí ọmọbìnrin yín ti ní jẹjẹrẹ ọmú tàbí jẹjẹrẹ ẹyin obìnrin (ovary)?",
      summary: "Ìyá, ẹ̀gbọ́n/àbúrò obìnrin tàbí ọmọbìnrin pẹ̀lú jẹjẹrẹ ọmú tàbí ti ẹyin obìnrin",
      options: yesNoUnknown,
    },
    H1b: {
      prompt: "Ọmọ ọdún mélòó ni ó jẹ́ nígbà tí wọ́n rí i?",
      summary: "Ọjọ́ orí rẹ̀ nígbà tí wọ́n rí i",
      options: { under40: "Kò tíì tó ọdún 40", "40to49": "Ọdún 40 sí 49", "50plus": "Ọdún 50 tàbí jù bẹ́ẹ̀ lọ", unknown: "Mi ò mọ̀" },
    },
    H2: {
      prompt: "Ṣé ẹ̀yin tàbí ẹnikẹ́ni nínú ìdílé yín ní ìyípadà nínú jíìnì (gene) tí a ti mọ̀, bí i BRCA1, BRCA2, tàbí PALB2?",
      helper:
        "Jíìnì ni àwọn ìtọ́ni tí ó ń ti òbí kọjá sí ọmọ nínú ìdílé. Àyẹ̀wò ẹ̀jẹ̀ àkànṣe lè ṣàwárí ìyípadà nínú àwọn jíìnì kan. Tí ẹnikẹ́ni kò bá tíì sọ fún yín nípa èyí, ẹ yan \"Rárá\" tàbí \"Mi ò mọ̀\".",
      summary: "Ìyípadà jíìnì tí a mọ̀ nínú ìdílé",
      options: yesNoUnknown,
    },
    H3: {
      prompt: "Ṣé wọ́n ti fi ìtànṣán (radiation) tọ́jú àyà yín kí ẹ tó pé ọmọ ọdún 30?",
      helper: "Fún àpẹẹrẹ, ìtọ́jú fún lymphoma.",
      summary: "Ìtọ́jú ìtànṣán ní àyà kí ó tó pé ọdún 30",
      options: yesNoUnknown,
    },
    H4: {
      prompt: "Ṣé ẹ ti ní jẹjẹrẹ ọmú rí, tàbí àyẹ̀wò biopsy tó fi sẹ́ẹ̀lì \"atypical\" tàbí LCIS hàn?",
      helper: "\"Atypical\" àti \"LCIS\" jẹ́ ọ̀rọ̀ tí ó lè wà nínú ìwé èsì biopsy. Tí kò bá dá yín lójú, ẹ yan \"Mi ò mọ̀\".",
      summary: "Jẹjẹrẹ ọmú tẹ́lẹ̀, tàbí sẹ́ẹ̀lì atypical tàbí LCIS nínú biopsy",
      options: yesNoUnknown,
    },
    H5: {
      prompt: "Ìgbà wo ni ẹ ṣe àyẹ̀wò mammogram tàbí ultrasound ọmú kẹ́yìn, kí ni ó sì fi hàn?",
      summary: "Mammogram tàbí ultrasound ọmú tó kẹ́yìn",
      options: {
        lastYearNormal: "Láàárín ọdún kan sẹ́yìn, kò sí ìṣòro",
        "1to2yearsNormal": "Ọdún 1 sí 2 sẹ́yìn, kò sí ìṣòro",
        followUp: "Wọ́n ní kí n padà wá fún àyẹ̀wò míì",
        never: "Mi ò ṣe é rí",
        dontRemember: "Mi ò rántí",
      },
    },
  },
  painInjuryHelper: "Nǹkan tó gbá ni lè fa ìrora tàbí ọgbẹ́ tí yóò pòórá láàárín ọ̀sẹ̀ díẹ̀.",

  illustrations: {
    mirrorPositions: ["Apá ní ẹ̀gbẹ́ yín", "Ọwọ́ ní ìbàdí", "Apá lókè orí yín"],
    mirror: "Ọ̀nà mẹ́ta láti dúró níwájú dígí: apá ní ẹ̀gbẹ́ yín, ọwọ́ tí ẹ tẹ̀ mọ́ ìbàdí, àti apá tí ẹ gbé sókè lórí yín.",
    lyingDown: "Ẹnì kan dùbúlẹ̀ pẹ̀lú apá kan lókè orí, ó ń lo inú ìka àárín mẹ́ta láti tẹ ọmú ní àyíká kéékèèké.",
    breastDiagram: (side: string) =>
      `Àwòrán ọmú ${side} tí a pín sí apá mẹ́rin ní àyíká orí ọmú. A kọ ẹ̀gbẹ́ abíyá sí i. Ẹ tún lè yan nínú àkójọ.`,
    armpitSide: "Ẹ̀gbẹ́ abíyá",
    middleSide: "Àárín àyà",
    right: "ọ̀tún",
    left: "òsì",
    openings: "Orí ọmú kan pẹ̀lú ihò kékeré kan, àti orí ọmú kan pẹ̀lú ọ̀pọ̀lọpọ̀ ihò kéékèèké.",
    oneOpening: "Ihò kan",
    severalOpenings: "Ọ̀pọ̀lọpọ̀ ihò",
  },

  selfCheck: {
    guideButton: "Ẹ wo ohun tí ẹ ó máa wá",
    guideTitle: "Ohun tí ẹ ó máa wá",
    guideIntro: "Ẹ mọ bí ọmú yín ṣe máa ń rí, àti bí ó ṣe máa ń rí lọ́wọ́. Ẹ wò, kí ẹ sì fọwọ́ wá:",
    signs: [
      "Ihò kéékèèké tàbí awọ tó ká jọ",
      "Pípọ́n",
      "Orí ọmú tó fà wọnú",
      "Ọmú kan tó yàtọ̀ sí èkejì",
      "Kókó tàbí ibi tó ki, nínú ọmú tàbí títí dé abíyá",
    ],
    guideOutro: "Tí ẹ bá ṣàkíyèsí èyíkéyìí nínú ìwọ̀nyí, tàbí ohunkóhun tó jẹ́ tuntun sí yín, ẹ yan \"Bẹ́ẹ̀ ni\" tàbí \"Mi ò dá mi lójú\", a ó sì béèrè ìbéèrè díẹ̀ sí i.",
    deferredTitle: "Ẹ lè parí àyẹ̀wò yìí nígbà míì",
    deferredText:
      "Nígbà tí ẹ bá wà ní ibi ìkọ̀kọ̀, ẹ dùbúlẹ̀ kí ẹ sì fọwọ́ wá kókó tàbí ibi tó ki. Lẹ́yìn náà, ẹ padà wá dáhùn àwọn ìbéèrè tó kù.",
    reminderTomorrow: "Fi ìránnilétí kún un fún ọ̀la",
    reminderNote: "Èyí yóò fi ìṣẹ̀lẹ̀ kún kàlẹ́ńdà tiyín. EarlyHer kì í fi ìránnilétí ránṣẹ́.",
    backToQuestion: "Padà sí ìbéèrè náà",
    learn: "Kẹ́kọ̀ọ́ nípa ìlera ọmú",
  },

  results: {
    title: "Ìgbésẹ̀ yín tó kàn",
    ready: "Ìgbésẹ̀ yín tó kàn ti ṣe tán",
    howSoon: "Bí ó ṣe yẹ kí ẹ tètè wá ìtọ́jú tó",
    reasonsHeading: "Ohun tí ìtọ́sọ́nà yìí dá lé",
    moreReasons: (count: number) => `Ìdáhùn ${count} míì wà nínú àkópọ̀ yín.`,
    nextHeading: "Ohun tí ẹ ó ṣe báyìí",
    careHeading: "Àwọn ọ̀nà láti rí ìtọ́jú",
    bringHeading: "Ohun tí ẹ ó mú dání",
    bring: [
      "Ìgbà tí ẹ kọ́kọ́ ṣàkíyèsí ìyípadà náà, àti bí ó ti yípadà láti ìgbà náà",
      "Èsì àwọn àyẹ̀wò scan tàbí biopsy tí ẹ ti ṣe tẹ́lẹ̀",
      "Àkọsílẹ̀ gbogbo oògùn tí ẹ ń lò",
    ],
    outcomes: {
      red: {
        label: "Kánjúkánjú",
        timeframe: "Lónìí, láàárín wákàtí 24",
        headline: "Ẹ jẹ́ kí dókítà rí yín lónìí",
        body: "Ohun tí ẹ sọ fún wa lè jẹ́ àmì àkóràn tàbí ìṣòro míì tí ó nílò ìtọ́jú báyìí. Ẹ jọ̀wọ́ ẹ rí dókítà lónìí, tàbí kí ẹ lọ sí ibi ìtọ́jú pàjáwìrì tó súnmọ́ yín jù. Tí ẹ kò bá lè mí dáadáa tàbí tí àyà bá ń dùn yín, ẹ pe nọ́mbà pàjáwìrì àdúgbò yín lẹ́sẹ̀kẹsẹ̀.",
      },
      orange: {
        label: "Láìpẹ́",
        timeframe: "Láàárín ọ̀sẹ̀ 1",
        headline: "Ẹ rí dókítà ní ọ̀sẹ̀ yìí",
        body: "Dókítà gbọ́dọ̀ ṣàyẹ̀wò àwọn ìyípadà tí ẹ ṣàlàyé láàárín ọ̀sẹ̀ kan tó ń bọ̀. Àwọn ìdáhùn yìí kò sọ ohun tó ń fa ìyípadà náà. Àyẹ̀wò tó péye, àti nígbà míì scan, lè ṣàlàyé rẹ̀.",
      },
      yellow: {
        label: "Láàárín ọ̀sẹ̀ 4",
        timeframe: "Láàárín ọ̀sẹ̀ 4 tó ń bọ̀",
        headline: "Ẹ tètè ṣètò láti rí dókítà",
        body: "Ẹ jọ̀wọ́ ẹ ṣètò láti rí òṣìṣẹ́ ìlera láàárín ọ̀sẹ̀ 4 tó ń bọ̀, kí ó lè ṣàyẹ̀wò ohun tí ẹ ṣàlàyé. Tí ó bá tóbi sí i, tí ó bá ń dùn yín sí i, tàbí tí ẹ bá ṣàkíyèsí ohunkóhun tuntun, ẹ tètè lọ gba ìtọ́jú.",
      },
      green: {
        label: "Àyẹ̀wò déédéé",
        timeframe: "Ìtọ́jú déédéé",
        headline: "Kò sí ìdààmú kánjúkánjú",
        body: "Àwọn ìdáhùn yín kò fi hàn pé ẹ nílò ìtọ́jú kánjúkánjú. Àyẹ̀wò yìí kò lè yọ gbogbo ìṣòro kúrò. Tí ẹ bá ṣàkíyèsí ìyípadà, tàbí tí ọkàn yín kò bá balẹ̀, ẹ bá òṣìṣẹ́ ìlera sọ̀rọ̀.",
      },
      review: {
        label: "Ẹ bá akọ́ṣẹ́mọṣẹ́ sọ̀rọ̀",
        timeframe: "Ẹ béèrè lọ́wọ́ òṣìṣẹ́ ìlera bí ó ṣe yẹ kí wọ́n tètè rí yín tó",
        headline: "Ẹ bá òṣìṣẹ́ ìlera sọ̀rọ̀",
        body: "Díẹ̀ nínú àwọn ìdáhùn yín nílò ìmọ̀ràn òṣìṣẹ́ ìlera, a kò sì lè dábàá àkókò fún wọn níbí. Ẹ jọ̀wọ́ ẹ kàn sí òṣìṣẹ́ ìlera, ẹ sọ ohun tí ẹ ṣàlàyé fún un, kí ẹ sì béèrè bí ó ṣe yẹ kí wọ́n tètè rí yín tó. Tí ó bá tóbi sí i, tí ó bá ń dùn yín sí i, tàbí tí ẹ bá ṣàkíyèsí ohunkóhun tuntun, ẹ tètè lọ gba ìtọ́jú.",
      },
    },
    reasons: {
      inflamedFever: "Ẹ ní ibà tàbí ara yín gbóná bí ibà, apá kan ọmú yín sì pọ́n, gbóná, wú tàbí ń dùn yín gidigidi.",
      inflamed: "Apá kan ọmú yín pọ́n, gbóná, wú tàbí ń dùn yín gidigidi.",
      nippleInflamedFever: "Ẹ ní ibà tàbí ara yín gbóná bí ibà, àyíká orí ọmú yín sì pọ́n, gbóná tàbí ń dùn yín gidigidi.",
      nippleInflamed: "Àyíká orí ọmú yín pọ́n, gbóná tàbí ń dùn yín gidigidi.",
      pregnantLump: "Ẹ rí kókó nígbà tí ẹ lóyún tàbí tí ẹ ń fún ọmọ lọ́mú.",
      bodyChanges: "Láàárín oṣù kan sẹ́yìn, ara yín ti rù láìmọ ìdí, egungun ti ń dùn yín, ẹ ti ní orí fífọ́ tí kò lọ, tàbí ìríran yín ti yípadà.",
      bodyChangesLump: "Ẹ rí kókó, ẹ sì tún ti ní àwọn ìyípadà míì nínú ara yín láàárín oṣù kan sẹ́yìn.",
      armpitLump: "Kókó náà wà ní abíyá yín tàbí nítòsí rẹ̀.",
      lumpWeeks: "Ó ju ọ̀sẹ̀ 2 lọ tí ẹ ti kọ́kọ́ ṣàkíyèsí kókó náà.",
      lumpChanged: "Kókó náà ti tóbi sí i tàbí ti yàtọ̀ láti ìgbà tí ẹ kọ́kọ́ ṣàkíyèsí rẹ̀.",
      lumpCyclic: "Láìpẹ́ yìí lẹ ṣàkíyèsí kókó náà, ó sì ń yípadà pẹ̀lú nǹkan oṣù yín.",
      lumpNotCyclic: "Kókó náà kì í wá, kì í sì í lọ pẹ̀lú nǹkan oṣù.",
      lumpCycleUnsure: "Kò dá yín lójú bóyá kókó náà ń yípadà pẹ̀lú nǹkan oṣù yín.",
      lumpHard: "Kókó náà le gan-an.",
      lumpFirm: "Kókó náà le díẹ̀.",
      lumpFeelUnsure: "Kò dá yín lójú bí kókó náà ṣe rí lọ́wọ́.",
      lumpEdges: "Etí kókó náà kò dọ́gba tàbí ó ṣòro láti tọpasẹ̀.",
      lumpEdgesUnsure: "Kò dá yín lójú bí etí kókó náà ṣe rí.",
      lumpFixed: "Kókó náà dà bí ẹni pé ó lẹ̀ mọ́ ibì kan.",
      lumpMoveUnsure: "Kò dá yín lójú bóyá kókó náà ń sún.",
      lumpPastUnknown: "Ẹ ti ní kókó, àpò omi tí wọ́n fà jáde, tàbí biopsy rí, ẹ kò sì mọ èsì rẹ̀.",
      fluidOwn: "Omi ń dá jáde láti orí ọmú yín fúnra rẹ̀.",
      fluidOneOpening: "Omi ń jáde láti ihò kan ní ọmú kan, ó sì lè máa dá jáde fúnra rẹ̀.",
      fluidBloody: "Omi náà ní àwọ̀ pupa rúsúrúsú, pupa, tàbí ẹ̀jẹ̀.",
      fluidClearOwn: "Omi tó mọ́ gaara ń dá jáde láti ọmú kan fúnra rẹ̀.",
      fluidMilky: "Omi tó funfun bí wàrà ń jáde láti ọmú méjèèjì nígbà tí ẹ bá fún un.",
      fluidThick: "Omi tó ki tàbí tó ní àwọ̀ ń jáde láti ọ̀pọ̀lọpọ̀ ihò.",
      fluidCheck: "Ó yẹ kí wọ́n ṣàyẹ̀wò àwọ̀ àti bí omi tí ẹ ṣàlàyé ṣe ń jáde.",
      fluidWithOther: "Pẹ̀lú omi náà, ẹ ní kókó, ibi tó ki, tàbí ìyípadà ní orí ọmú.",
      fluidHormone: "Pẹ̀lú omi náà, ẹ ti ní orí fífọ́, ìyípadà ìríran, tàbí nǹkan oṣù tí kò wá.",
      painStrong: "Ìrora yín le gan-an tàbí ó ń dí yín lọ́wọ́ láti sùn tàbí ṣe iṣẹ́ ojoojúmọ́, kò sì tẹ̀lé nǹkan oṣù yín.",
      painLasting: "Ìrora yín ti tó ọ̀sẹ̀ 2 tàbí jù bẹ́ẹ̀ lọ, kò sì tẹ̀lé nǹkan oṣù yín.",
      painSpotLasting: "Ìrora yín wà ní ibì kékeré kan, ó sì ti tó ọ̀sẹ̀ 2 tàbí jù bẹ́ẹ̀ lọ.",
      skinDimpling: "Ẹ ṣàkíyèsí ihò kéékèèké tàbí awọ tó ká jọ.",
      skinOrangePeel: "Awọ náà rí bí èèpo ọsàn tàbí ó ki.",
      skinRedness: "Apá kan ọmú yín pọ́n.",
      skinSwelling: "Ọmú yín wú tàbí ó wúwo ju ti tẹ́lẹ̀ lọ.",
      skinWarm: "Ọmú yín gbóná.",
      nippleInversion: "Orí ọmú yín ṣẹ̀ṣẹ̀ yí wọnú.",
      nippleScaly: "Awọ orí ọmú yín tàbí àyíká rẹ̀ ń bó, ó ní èépá tàbí ó ń yún, kò sì jọ ẹ̀yi (eczema) tí ìpara máa ń wò sàn.",
      nippleScalyClears: "Awọ orí ọmú yín tàbí àyíká rẹ̀ ń bó tàbí ń yún, ẹ sì ní ẹ̀yi (eczema) níbòmíì tí ìpara máa ń wò sàn.",
      changeWorse: "Ìyípadà náà ń tàn kálẹ̀ tàbí ó ń burú sí i.",
      severalSigns: "Bí a bá kó ọ̀pọ̀ nínú àwọn ìdáhùn yín pọ̀, ó dára jù kí wọ́n ṣàyẹ̀wò yín láàárín ọ̀sẹ̀ kan.",
      historyPlus: "Ẹ ṣàlàyé ìyípadà kan, ìtàn ìlera yín tàbí ti ìdílé yín sì fi hàn pé ó dára jù kí wọ́n tètè ṣàyẹ̀wò yín.",
      historyGreen: "Ẹ sọ fún wa nípa ìtàn ìlera yín tàbí ti ìdílé yín, èyí tí ó lè nípa lórí ìgbà tí ó yẹ kí ẹ máa ṣe àyẹ̀wò.",
      injuryPain: "Ìrora yín bẹ̀rẹ̀ lẹ́yìn tí nǹkan gbá yín ní àyà láìpẹ́ yìí, ẹ kò sì ṣàlàyé àmì ewu míì.",
      noWarningSigns: "Àwọn ìdáhùn yín kò bá àwọn àmì tí ó nílò kí ẹ tètè rí dókítà mu.",
      selfCheckNormal: "Ẹ sọ fún wa pé ọmú yín rí, ó sì rí lọ́wọ́ bí ó ti máa ń rí fún yín.",
      priorScanFollowUp: "Wọ́n ní kí ẹ padà wá fún àyẹ̀wò míì lẹ́yìn scan yín tó kẹ́yìn.",
    },
    advice: {
      recheckAfterPeriod: "Ẹ tún ṣàyẹ̀wò kókó náà lẹ́yìn nǹkan oṣù yín tó ń bọ̀. Tí ó bá ṣì wà, ẹ ṣètò láti rí dókítà.",
      hormoneCheck:
        "Ẹ sọ fún dókítà nípa orí fífọ́, ìyípadà ìríran, tàbí nǹkan oṣù tí kò wá. Ó lè dábàá àyẹ̀wò ẹ̀jẹ̀ láti ṣàyẹ̀wò àwọn hómónù yín.",
      bringMedicines: "Ẹ mú àkọsílẹ̀ gbogbo oògùn tí ẹ ń lò dání.",
      mammogram: "Ẹ béèrè lọ́wọ́ dókítà yín bí ó ṣe yẹ kí ẹ máa ṣe mammogram tó.",
      screening: "Nítorí ìtàn ìlera yín tàbí ti ìdílé yín, ẹ béèrè lọ́wọ́ dókítà yín nípa bíbẹ̀rẹ̀ àyẹ̀wò ní kùtùkùtù tàbí ṣíṣe é lóòrèkóòrè.",
      routineCheck: "Ó tó àkókò láti ṣètò àyẹ̀wò ọmú déédéé.",
      monthlySelfCheck: "Ṣíṣàyẹ̀wò ọmú yín lẹ́ẹ̀kan lóṣù ń ràn yín lọ́wọ́ láti mọ ohun tó jẹ́ déédéé fún yín.",
    },
    incompleteTitle: "Ẹ lè dáhùn àwọn ìbéèrè míì nígbà míì",
    incompleteText:
      "A dá àwọn ìbéèrè dúró ní kùtùkùtù nítorí ẹ nílò ìtọ́jú lónìí. Tí ẹ bá ní àyè, dídáhùn àwọn ìbéèrè díẹ̀ sí i lè ran dókítà yín lọ́wọ́. Gbígba ìtọ́jú ló ṣáájú.",
    continueQuestions: "Dáhùn àwọn ìbéèrè díẹ̀ sí i fún dókítà mi",
    actions: {
      findCareNow: "Wá ìtọ́jú nítòsí mi báyìí",
      talkNow: "Bá òṣìṣẹ́ ìlera sọ̀rọ̀ báyìí",
      findFacility: "Wá ibi ìtọ́jú ìlera",
      talkDoctor: "Bá dókítà sọ̀rọ̀",
      findCare: "Wá ìtọ́jú",
      routineCare: "Wá ibi ìtọ́jú fún àyẹ̀wò déédéé",
      book: "Ṣètò àkókò ní ọ̀sẹ̀ yìí",
      bookVisit: "Ṣètò àkókò láti rí dókítà",
      summary: "Gba àkópọ̀ mi",
      viewSummary: "Wo àkópọ̀ mi",
      recheckReminder: "Fi ìránnilétí kún un láti tún ṣàyẹ̀wò lẹ́yìn ọ̀sẹ̀ 2",
      monthlyReminder: "Fi ìránnilétí oṣooṣù kún un fún àyẹ̀wò ara ẹni",
      selfCheckGuide: "Ìtọ́sọ́nà àyẹ̀wò ara ẹni",
      learn: "Kẹ́kọ̀ọ́ nípa ìlera ọmú",
    },
    telemedicineUnavailable: "Ìbánisọ̀rọ̀ pẹ̀lú dókítà lórí ayélujára kò tíì sí nípasẹ̀ EarlyHer.",
    reminderNote: "A ó fi àwọn ìránnilétí kún kàlẹ́ńdà tiyín. EarlyHer kì í fi ìránnilétí ránṣẹ́.",
    backToAnswers: "Padà sí àwọn ìdáhùn mi",
    noResult: {
      title: "Kò sí ìgbésẹ̀ tó kàn láti fi hàn",
      text: "Láti dáàbò bo àṣírí yín, a máa ń pa àwọn ìdáhùn rẹ́ nígbà tí ìgbà ìlò bá parí. Ẹ lè bẹ̀rẹ̀ lẹ́ẹ̀kan sí i nígbàkigbà tí ẹ bá ṣetán.",
    },
    concern: "Mo ní ìdààmú",
  },

  booking: {
    noSlot: "A kò rí àkókò ìpàdé ní àsìkò tó yẹ. Ẹ jọ̀wọ́ ẹ kàn sí ibi ìtọ́jú ìlera fún ọ̀nà míì.",
    unavailable: "Ṣíṣètò àkókò lórí ayélujára kò tíì sí nípasẹ̀ EarlyHer. Ẹ lè wá ibi ìtọ́jú kan, kí ẹ sì kàn sí wọn tààrà.",
  },

  finderContext: {
    heading: "Ìtọ́sọ́nà yín",
    windowNote:
      "Wíwà níbí kò túmọ̀ sí pé ibi ìtọ́jú náà lè rí yín láàárín àkókò yìí. Ẹ jọ̀wọ́ ẹ kàn sí ibi ìtọ́jú náà tàbí kí ẹ lọ fúnra yín láti béèrè.",
    redNote: "Tí ó bá jẹ́ pàjáwìrì, ẹ lọ sí ibi ìtọ́jú pàjáwìrì tó súnmọ́ yín jù.",
    backToResult: "Padà sí èsì mi",
    backToQuestions: "Padà sí àwọn ìbéèrè mi",
  },

  summary: {
    title: "Àkópọ̀ yín",
    intro: "Ojú-ìwé yìí kọ ohun tí ẹ sọ fún wa sílẹ̀, kí ẹ má ṣe ní láti tún gbogbo rẹ̀ ṣàlàyé.",
    generated: (date: string) => `A ṣe é ní ${date}`,
    urgency: "Ìtọ́sọ́nà",
    reasons: "Ìdí",
    incomplete: "A kò dáhùn àwọn ìbéèrè kan nítorí ìtọ́jú ni a nílò lónìí.",
    notAsked: "A kò béèrè",
    locationLabel: "Ibi tó wà nínú ọmú",
    sections: {
      about: "Nípa yín",
      safety: "Àyẹ̀wò ààbò",
      lump: "Kókó tàbí ibi tó ki",
      fluid: "Omi láti orí ọmú",
      pain: "Ìrora ọmú",
      skin: "Ìyípadà awọ ara tàbí orí ọmú",
      selfCheck: "Àyẹ̀wò ara ẹni",
      history: "Ìtàn ìlera",
    },
    notAskedReasons: {
      A2: "A kò béèrè, nítorí kókó náà wà ní abíyá tàbí nítòsí rẹ̀",
      A4: "A kò béèrè, nítorí kò tíì tó ọ̀sẹ̀ 1 tí ó ti ṣàkíyèsí rẹ̀",
      B8: "Ó ti dáhùn rẹ̀ nínú àyẹ̀wò ààbò",
      C6: "Ó ti dáhùn rẹ̀ nínú àyẹ̀wò ààbò",
    },
    download: "Gba PDF",
    share: "Pín in",
    shareNote: "Pípín yóò ṣí àwọn ọ̀nà pípín ti ẹ̀rọ yín. A kò ní fi nǹkan ránṣẹ́ àyàfi tí ẹ bá yan ibi tí ẹ fẹ́ fi ránṣẹ́ sí.",
    shareFailed: "Pípín kò ṣiṣẹ́ lórí ẹ̀rọ yìí. Ẹ lè gba PDF dípò rẹ̀.",
    downloadFailed: "A kò lè ṣe PDF náà. Ẹ jọ̀wọ́ ẹ gbìyànjú lẹ́ẹ̀kan sí i.",
    backToResult: "Padà sí èsì mi",
    pdfTitle: "Àkópọ̀ EarlyHer",
    pdfDisclaimer: "Ìtọ́sọ́nà ni èyí, kì í ṣe ìdámọ̀ àìsàn. Àwọn ìdáhùn yìí kò sọ ohun tó ń fa ìyípadà náà.",
    pdfInEnglish: "PDF náà wà ní èdè Gẹ̀ẹ́sì, kí dókítà èyíkéyìí lè kà á. Kò tíì lè fi àmì ohùn Yorùbá hàn.",
    fileName: "health-summary.pdf",
  },

  save: {
    label: "Fi ìlọsíwájú mi pamọ́ sórí ẹ̀rọ yìí",
    help: "Ẹnikẹ́ni tó bá ń lo ẹ̀rọ yìí lè rí àwọn ìdáhùn tí ẹ fi pamọ́. A ó pa wọ́n rẹ́ lẹ́yìn ọjọ́ 7, nígbà tí ẹ bá tẹ Parí, tàbí tí a kò bá lo ojú-ìwé náà fún ìgbà díẹ̀.",
    saved: "A ti fi ìlọsíwájú yín pamọ́ sórí ẹ̀rọ yìí.",
    delete: "Pa àwọn ìdáhùn tí mo fi pamọ́ rẹ́",
    deleted: "A ti pa àwọn ìdáhùn tí ẹ fi pamọ́ rẹ́.",
    unavailable: "Ẹ̀rọ yìí kò lè fi ìlọsíwájú pamọ́.",
  },

  privacy: {
    title: "Bí EarlyHer ṣe ń bójú tó àwọn ìdáhùn yín",
    intro: "Ojú-ìwé yìí ṣàlàyé ohun tó ń ṣẹlẹ̀ sí àwọn ìdáhùn tí ẹ fún wa nígbà àyẹ̀wò.",
    points: [
      "A ń lo àwọn ìdáhùn yín lórí ẹ̀rọ yìí láti mọ bí ó ṣe yẹ kí ẹ tètè wá ìtọ́jú tó, àti láti fi ìgbésẹ̀ yín tó kàn hàn. Àwọn òfin ìtọ́sọ́nà ń ṣiṣẹ́ nínú ètò yìí; a kò fi àwọn ìdáhùn yín ránṣẹ́ sí sáfà (server).",
      "A kì í béèrè orúkọ yín, nọ́mbà fóònù yín tàbí ímeèlì yín nígbà àyẹ̀wò.",
      "Àwọn ìdáhùn yín wà nínú ìrántí ojú-ìwé yìí. A ó pa wọ́n rẹ́ nígbà tí ẹ bá tẹ Parí, tí a kò bá lo ojú-ìwé náà fún ìṣẹ́jú díẹ̀, tàbí tí ẹ bá pa ojú-ìwé náà dé tàbí tún un ṣí.",
      "Tí ẹ bá yan \"Fi ìlọsíwájú mi pamọ́ sórí ẹ̀rọ yìí\", a ó fi àwọn ìdáhùn yín pamọ́ sínú aṣàwákiri (browser) yìí fún ọjọ́ 7 ní púpọ̀ jù, kí ẹ lè padà wá. Ẹnikẹ́ni tó bá ń lo ẹ̀rọ yìí lè rí wọn, nítorí náà ẹ má ṣe fi pamọ́ sórí ẹ̀rọ tí ọ̀pọ̀ ènìyàn ń lò. Ẹ lè pa wọ́n rẹ́ nígbàkigbà.",
      "A ń pín àwọn ìdáhùn yín tí ẹ bá yàn láti ṣe bẹ́ẹ̀ nìkan, fún àpẹẹrẹ, tí ẹ bá gba àkópọ̀ yín tàbí pín in.",
      "Tí Tẹ́tí sílẹ̀ bá ń lo ohùn lórí ayélujára (fún àpẹẹrẹ fún Yorùbá), ètò yìí máa ń béèrè ọ̀rọ̀ tó wà lójú ìwé, bí ìbéèrè tàbí àlàyé èsì, lọ́wọ́ iṣẹ́ ohùn náà. A kì í fi àwọn ìdáhùn yín tàbí àkópọ̀ yín ránṣẹ́, EarlyHer kì í sì í kọ àwọn ìbéèrè wọ̀nyí sílẹ̀.",
      "Tí ẹ bá yan \"Lo ibi tí mo wà\" lórí ojú-ìwé ìwádìí ibi ìtọ́jú, ojú-ìwé yẹn nìkan ló ń lo ibi tí ẹ wà. A kì í fi pamọ́, a kì í sì í fi ránṣẹ́ sí ibikíbi.",
    ],
    pending: "A ó so ìlànà àṣírí EarlyHer tó pé pérépéré mọ́ ibí nígbà tí a bá ti gbé e jáde.",
    back: "Padà sẹ́yìn",
  },

  calendar: {
    selfCheckTitle: "EarlyHer: àyẹ̀wò ọmú ara ẹni",
    selfCheckText: "Ẹ dùbúlẹ̀ kí ẹ sì fọwọ́ wá kókó tàbí ibi tó ki nínú ọmú méjèèjì, lẹ́yìn náà ẹ parí àyẹ̀wò EarlyHer yín.",
    recheckTitle: "EarlyHer: àyẹ̀wò lẹ́ẹ̀kejì",
    recheckText: "Ẹ tún ṣàyẹ̀wò. Tí ó bá ṣì wà, tàbí tí ó bá ti yípadà, ẹ ṣètò láti rí dókítà.",
    monthlyTitle: "EarlyHer: àyẹ̀wò ọmú oṣooṣù",
    monthlyText: "Ẹ wò, kí ẹ sì fọwọ́ wá ìyípadà kankan nínú ọmú yín.",
    fileName: "reminder.ics",
  },
};

export const triageYoReview: ClinicalReview = {
  status: "draft",
  note: "AI-assisted draft (2026-10-23). Not clinically approved. Needs review by a fluent Yoruba speaker and the clinical lead before use.",
};
