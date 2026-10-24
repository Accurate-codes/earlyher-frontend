import type { UiText } from "@/content/en/ui";
import type { TranslationTable } from "@/lib/i18n/translate";
import type { ClinicalReview } from "@/lib/types/clinical";

/**
 * Yoruba interface text: same structure and keys as content/en/ui.ts.
 *
 * DRAFT. Written on 2026-10-23 with an AI assistant, not by a fluent Yoruba speaker, and
 * not yet reviewed. While `uiYoReview.status` is not "approved" the interface shows a
 * "draft translation" notice whenever Yoruba is selected. See docs/yoruba-review.md.
 *
 * To correct wording: edit the text between the quotes and keep the key names. Keep tone
 * marks and the letters ẹ, ọ, ṣ. Any key you delete is shown in English, with a notice.
 * After editing, run `npm test` (checks every key is present) and, if recordings exist,
 * `npm run audio:status -- yo` to see which recordings now need re-recording.
 */
export const uiYo: TranslationTable<UiText> = {
  appName: "EarlyHer",
  logoAlt: "EarlyHer",

  common: {
    listen: "Tẹ́tí sílẹ̀",
    stop: "Dúró",
    back: "Padà sẹ́yìn",
    next: "Èyí tó kàn",
    finish: "Parí",
    close: "Pa á dé",
    cancel: "Fagilé",
    tryAgain: "Gbìyànjú lẹ́ẹ̀kan sí i",
    home: "Ìbẹ̀rẹ̀",
    startAgain: "Bẹ̀rẹ̀ lẹ́ẹ̀kan sí i",
    findHealthcare: "Wá ibi ìtọ́jú ìlera",
    learnMore: "Kẹ́kọ̀ọ́ sí i",
    checkConcern: "Mo ní ìdààmú nípa ọmú mi",
    print: "Tẹ̀ ẹ́ jáde",
    sendBySms: "Fi ránṣẹ́ nípasẹ̀ SMS",
    loading: "Ó ń bọ̀…",
    draft: "Àkọsílẹ̀",
    draftLong: "Àkọsílẹ̀ àkọ́kọ́, òṣìṣẹ́ ìlera kò tíì yẹ̀ ẹ́ wò",
    demo: "Àpẹẹrẹ",
    skipToContent: "Lọ tààrà sí ọ̀rọ̀ pàtàkì",
    flowNavigation: "Ìrìn ojú-ìwé",
    opensInNewTab: "(yóò ṣí ní ojú-ìwé tuntun)",
    important: "Ó ṣe pàtàkì",
  },

  language: {
    label: "Èdè",
    // Language names are written in their own language so speakers can find them.
    names: { en: "English", yo: "Yorùbá" },
    pending: "Àwọn ọ̀rọ̀ kan kò tíì ní ìtumọ̀ Yorùbá, nítorí náà wọ́n wà ní èdè Gẹ̀ẹ́sì.",
    draft: "Ìtumọ̀ àkọ́kọ́ ni èyí: ẹni tó gbọ́ Yorùbá dáadáa àti òṣìṣẹ́ ìlera kò tíì yẹ̀ ẹ́ wò.",
    missingCount: (missing: number, total: number) => `Ọ̀rọ̀ ${missing} nínú ${total} kò tíì ní ìtumọ̀.`,
  },

  audio: {
    loading: "Ohùn ń bọ̀…",
    pause: "Dá a dúró díẹ̀",
    resume: "Tẹ̀síwájú",
    retry: "Gbìyànjú lẹ́ẹ̀kan sí i",
    deviceVoice: "Ohùn ẹ̀rọ yìí ló ń kà á.",
    generated: "Kọ̀ǹpútà (AI) ló ṣẹ̀dá ohùn yìí.",
    unavailable: "Ohùn Yorùbá kò tíì sí fún ojú-ìwé yìí. Gbogbo ọ̀rọ̀ wà lójú ìwé.",
    errors: {
      network: "Ohùn náà kò lè dé. Ẹ ṣàyẹ̀wò ìsopọ̀ íntánẹ́ẹ̀tì, kí ẹ sì gbìyànjú lẹ́ẹ̀kan sí i.",
      busy: "Ohùn ń ṣiṣẹ́ lọ́wọ́ báyìí. Ẹ jọ̀wọ́ ẹ gbìyànjú lẹ́yìn ìṣẹ́jú kan.",
      failed: "A kò lè ka ohùn náà. Ẹ jọ̀wọ́ ẹ gbìyànjú lẹ́ẹ̀kan sí i.",
    },
  },

  home: {
    privacy: "Àṣírí yín wà ní ààbò, ẹ kò nílò àkáǹtì",
    title: "Níbo lẹ fẹ́ bẹ̀rẹ̀?",
    text: "Ẹ yan èyí tó bá yín mu jù. Ẹ lè padà wá yan òmíràn nígbàkigbà.",
    journeysLabel: "Ẹ yan ibi tí ẹ ó ti bẹ̀rẹ̀",
    journeys: {
      concern: { title: "Mo ní ìdààmú nípa ọmú mi", text: "Ẹ dáhùn àwọn ìbéèrè díẹ̀ nípa ohun tí ẹ ṣàkíyèsí." },
      noConcern: { title: "Mi ò ní ìdààmú kankan", text: "Ìmọ̀ fún ìgbà tí ẹ kò ṣàkíyèsí ohunkóhun." },
      healthcare: { title: "Wá ibi ìtọ́jú ìlera", text: "Ẹ wá àwọn ibi ìtọ́jú ìlera ní Ìpínlẹ̀ Èkó." },
    },
  },

  questionnaire: {
    title: "Ìdààmú yín nípa ọmú",
  },

  results: {
    title: "Ìgbésẹ̀ yín tó kàn",
    telemedicine: {
      title: "Bá dókítà sọ̀rọ̀ lórí ayélujára",
      text: (provider: string) => `Ẹ bá dókítà sọ̀rọ̀ nípasẹ̀ ${provider}, iṣẹ́ ìtọ́jú lórí ayélujára tó dá dúró.`,
      open: (provider: string) => `Lọ sí ${provider}`,
      leaving: "Ẹ ó kúrò ní EarlyHer. Iṣẹ́ kejì náà ní òfin àti ìlànà àṣírí tirẹ̀.",
      unavailable: "Ìbánisọ̀rọ̀ pẹ̀lú dókítà lórí ayélujára kò tíì sí nípasẹ̀ EarlyHer.",
    },
    facility: {
      title: "Lọ sí ibi ìtọ́jú ìlera",
      text: "Ẹ wá àwọn ibi ìtọ́jú ìlera lórí máàpù, kí ẹ sì rí ọ̀nà síbẹ̀.",
      open: "Wá ibi ìtọ́jú",
    },
  },

  noConcern: {
    title: "Mi ò ní ìdààmú kankan",
  },

  finder: {
    title: "Wá ibi ìtọ́jú ìlera",
    intro: "Ẹ wá àwọn ibi ìtọ́jú ìlera ní Ìpínlẹ̀ Èkó pẹ̀lú orúkọ tàbí agbègbè.",
    searchLabel: "Ẹ wá pẹ̀lú orúkọ ibi ìtọ́jú, wọ́ọ̀dù tàbí agbègbè",
    searchPlaceholder: "Fún àpẹẹrẹ: Surulere tàbí Ikeja",
    lgaLabel: "Ìjọba ìbílẹ̀ (LGA)",
    allLgas: "Gbogbo ìjọba ìbílẹ̀ ní Èkó",
    useLocation: "Lo ibi tí mo wà",
    locating: "À ń wá ibi tí ẹ wà…",
    locationOn: "A tò wọ́n bí wọ́n ṣe jìnnà sí yín ní ìlà tààrà",
    locationPrivacy: "Ojú-ìwé yìí nìkan ló ń lo ibi tí ẹ wà. A kì í fi pamọ́, a kì í sì í fi ránṣẹ́ sí ibikíbi.",
    stopLocation: "Má lo ibi tí mo wà mọ́",
    locationDenied: "Ẹ kò fún wa ní àṣẹ láti mọ ibi tí ẹ wà. Ẹ ṣì lè wá pẹ̀lú orúkọ tàbí agbègbè.",
    locationUnavailable: "A kò rí ibi tí ẹ wà. Ẹ ṣì lè wá pẹ̀lú orúkọ tàbí agbègbè.",
    locationUnsupported: "Ẹ̀rọ yìí kò lè fi ibi tí ẹ wà hàn. Ẹ ṣì lè wá pẹ̀lú orúkọ tàbí agbègbè.",
    results: (shown: number, total: number) =>
      shown === total
        ? `Ibi ìtọ́jú ${total.toLocaleString("en-NG")}`
        : `À ń fi ${shown.toLocaleString("en-NG")} hàn nínú ibi ìtọ́jú ${total.toLocaleString("en-NG")}`,
    showMore: "Fi àwọn ibi ìtọ́jú míì hàn",
    clearFilters: "Pa ìwádìí rẹ́",
    listLabel: "Àwọn ibi ìtọ́jú",
    mapLabel: "Máàpù àwọn ibi ìtọ́jú",
    mapHelp: "Ẹ yan ibi ìtọ́jú kan nínú àkójọ tàbí lórí máàpù láti rí àlàyé rẹ̀.",
    mapOffline: "Máàpù nílò íntánẹ́ẹ̀tì. Àkójọ àwọn ibi ìtọ́jú ṣì ń ṣiṣẹ́.",
    mapError: "Máàpù kò ṣí. Àkójọ àwọn ibi ìtọ́jú ṣì ń ṣiṣẹ́.",
    loading: "À ń gbé àwọn ibi ìtọ́jú wá…",
    empty: "Kò sí ibi ìtọ́jú tó bá ìwádìí yín mu.",
    emptyHelp: "Ẹ gbìyànjú orúkọ tàbí agbègbè míì, tàbí ẹ yan ìjọba ìbílẹ̀ míì.",
    noData: "Kò sí àkọsílẹ̀ ibi ìtọ́jú kankan láti fi hàn báyìí.",
    unavailable: "Àlàyé nípa àwọn ibi ìtọ́jú kò sí báyìí.",
    offline:
      "Ẹ kò ní íntánẹ́ẹ̀tì, a kò sì tíì fi àkójọ àwọn ibi ìtọ́jú pamọ́ sórí ẹ̀rọ yìí. Ẹ jọ̀wọ́ ẹ so mọ́ íntánẹ́ẹ̀tì, kí ẹ sì gbìyànjú lẹ́ẹ̀kan sí i.",
    failure: "A kò lè gbé àlàyé nípa àwọn ibi ìtọ́jú wá. Ẹ jọ̀wọ́ ẹ gbìyànjú lẹ́ẹ̀kan sí i.",
    generalHelp:
      "Ẹ ṣì lè lọ sí ilé ìwòsàn alábọ́dé (PHC) tàbí ilé ìwòsàn tó súnmọ́ yín jù, kí ẹ sì ní kí ẹ bá òṣìṣẹ́ ìlera sọ̀rọ̀.",
    distance: (km: number) =>
      km < 1
        ? `Bí i mítà ${Math.max(50, Math.round((km * 1000) / 50) * 50)} ní ìlà tààrà`
        : `Bí i kìlómítà ${km.toFixed(1)} ní ìlà tààrà`,
    distanceNote: "Jíjìnnà ní ìlà tààrà ni, kì í ṣe gígùn ọ̀nà tí ẹ ó gbà.",
    showDetails: "Fi àlàyé hàn",
    hideDetails: "Fi àlàyé pamọ́",
    directions: "Rí ọ̀nà síbẹ̀",
    openMap: "Ṣí i nínú Google Maps",
    externalNote: "Ọ̀nà síbẹ̀ yóò ṣí nínú Google Maps, ó sì nílò íntánẹ́ẹ̀tì.",
    fields: {
      type: "Irú",
      level: "Ìpele ìtọ́jú",
      ownership: "Ẹni tó ni í",
      area: "Agbègbè",
      address: "Àdírẹ́sì",
      phone: "Fóònù",
      hours: "Àkókò ìṣísílẹ̀",
      services: "Àwọn iṣẹ́ ìtọ́jú",
      hfrCode: "Nọ́mbà nínú Àkọsílẹ̀ Àwọn Ibi Ìtọ́jú Ìlera (HFR)",
      source: "Orísun",
    },
    area: (ward: string | null, lga: string | null, state: string | null) =>
      [ward ? `Wọ́ọ̀dù ${ward}` : null, lga ? `Ìjọba Ìbílẹ̀ ${lga}` : null, state ? `Ìpínlẹ̀ ${state}` : null]
        .filter(Boolean)
        .join(", "),
    addressMissing: "Àdírẹ́sì òpópónà kò sí nínú àkọsílẹ̀ yìí",
    notVerified: "A kò tíì fìdí rẹ̀ múlẹ̀",
    unverifiedNote:
      "A kò fi nọ́mbà fóònù, àkókò ìṣísílẹ̀ àti àwọn iṣẹ́ ìtọ́jú hàn nítorí a kò tíì fìdí wọn múlẹ̀. Ẹ jọ̀wọ́ ẹ bá ibi ìtọ́jú náà sọ̀rọ̀ kí ẹ tó lọ.",
    breastCareNote: "Wíwà níbí kò túmọ̀ sí pé ibi ìtọ́jú náà ní ìtọ́jú àkànṣe fún ọmú.",
    locationNote: "Ibi tí ó wà lórí máàpù wá láti inú àkọsílẹ̀, ó sì lè má péye.",
    nameDisagreement: "Àwọn orísun kò fohùn ṣọ̀kan nípa orúkọ wọ́ọ̀dù tàbí ìjọba ìbílẹ̀ ibi ìtọ́jú yìí.",
    coverageTitle: "Nípa àlàyé yìí",
    coverage: (count: number, state: string) =>
      `Ibi ìtọ́jú ìlera ${count.toLocaleString("en-NG")} ní Ìpínlẹ̀ ${state} nìkan. Àkójọ yìí kò pé, EarlyHer kò sì tíì ṣàyẹ̀wò rẹ̀.`,
    sourceLine: (name: string, released: string) => `Àkọsílẹ̀ àwọn ibi ìtọ́jú: ${name}, tí a gbé jáde ní ${released}.`,
    savedOn: (date: string) => `Ìgbà tí a ṣe àtúnṣe àkójọ yìí kẹ́yìn nínú ètò yìí: ${date}.`,
    offlineReady: "Lẹ́yìn tí ó bá ti dé, àkójọ àwọn ibi ìtọ́jú àti ìwádìí ń ṣiṣẹ́ láìsí íntánẹ́ẹ̀tì. Máàpù àti ọ̀nà síbẹ̀ nílò íntánẹ́ẹ̀tì.",
    licence: "Ìwé àṣẹ",
    simulated: "Ipò àpẹẹrẹ tí a yàn nínú pánẹ́ẹ̀lì ìdàgbàsókè.",
  },

  learn: {
    title: "Kí lẹ fẹ́ kẹ́kọ̀ọ́ nípa rẹ̀?",
    moduleCount: (cards: number) => `Káàdì kéékèèké ${cards}`,
    cardOf: (position: number, total: number) => `Káàdì ${position} nínú ${total}`,
    yes: "Bẹ́ẹ̀ ni",
    no: "Rárá",
    allTopics: "Gbogbo àkòrí",
    nextTopic: "Àkòrí tó kàn",
    notFound: { title: "A kò rí àkòrí yẹn", text: "Ẹ yan àkòrí kan nínú àkójọ." },
    complete: {
      title: "Ẹ ṣeun gan-an",
      text: "Ẹ ti parí àkòrí yìí. Kí lẹ fẹ́ ṣe báyìí?",
    },
    illustrationNote: "A ó fi àwọn àwòrán kún un nígbà tí a bá ti fọwọ́ sí àwòrán tó yẹ.",
  },

  sms: {
    offerTitle: "Ṣé kí a fi ìgbésẹ̀ yín tó kàn ránṣẹ́ sí fóònù yín?",
    offerText: "Kò pọn dandan. Ẹ kò nílò àkáǹtì.",
    noThanks: "Rárá, ẹ ṣeun",
    enterTitle: "Ẹ tẹ nọ́mbà fóònù yín",
    numberLabel: "Nọ́mbà fóònù",
    placeholder: "0803 123 4567",
    delete: "Pa nọ́mbà tó kẹ́yìn rẹ́",
    clear: "Pa gbogbo rẹ̀ rẹ́",
    preview: "Wo ọ̀rọ̀ náà ṣáájú",
    previewTitle: "Ẹ ṣàyẹ̀wò kí ẹ tó fi ránṣẹ́",
    to: "Sí",
    message: "Ọ̀rọ̀",
    edit: "Yí nọ́mbà padà",
    send: "Fi ránṣẹ́",
    sending: "À ń fi ránṣẹ́…",
    privacy: "A ń lo nọ́mbà yín láti fi ọ̀rọ̀ yìí ránṣẹ́ nìkan, a ó sì pa á rẹ́ nígbà tí ẹ bá parí.",
    errors: {
      empty: "Ẹ tẹ nọ́mbà fóònù yín.",
      "must-start-with-0": "Ẹ bẹ̀rẹ̀ pẹ̀lú 0, fún àpẹẹrẹ 0803 123 4567.",
      "too-short": "Nọ́mbà náà gbọ́dọ̀ ní òǹkà 11.",
      "not-a-mobile-number": "Èyí kò jọ nọ́mbà fóònù alágbèéká. Ẹ jọ̀wọ́ ẹ ṣàyẹ̀wò rẹ̀.",
    },
    templates: {
      "next-step":
        "EarlyHer: Ẹ ṣeun fún lílo EarlyHer. Ìgbésẹ̀ yín tó kàn ni láti bá òṣìṣẹ́ ìlera sọ̀rọ̀. Ìtọ́sọ́nà ni èyí, kì í ṣe ìdámọ̀ àìsàn.",
      facility: (name: string) =>
        `EarlyHer: Ibi tí ẹ wò ni ${name}. Ẹ jọ̀wọ́ ẹ bá òṣìṣẹ́ ìlera sọ̀rọ̀ níbẹ̀. Ìtọ́sọ́nà ni èyí, kì í ṣe ìdámọ̀ àìsàn.`,
    },
    accepted: "A ti gba ọ̀rọ̀ yín láti fi ránṣẹ́.",
    queued: "Ọ̀rọ̀ yín ń dúró de iṣẹ́ SMS láti fi ránṣẹ́.",
    notDelivery: "A kò lè fìdí rẹ̀ múlẹ̀ láti ibí pé ó ti dé orí fóònù yín.",
    simulated: "Ipò àpẹẹrẹ: àfihàn lásán ni èyí. A kò fi SMS gidi ránṣẹ́.",
    failure: "A kò lè fi SMS ránṣẹ́ báyìí.",
    offline: "Ẹ kò ní íntánẹ́ẹ̀tì, nítorí náà a kò lè fi SMS ránṣẹ́ báyìí. A kò fi nọ́mbà yín pamọ́ láti fi ránṣẹ́ nígbà míì.",
    printInstead: "Tẹ̀ ẹ́ jáde dípò rẹ̀",
  },

  print: {
    title: "Tẹ ìgbésẹ̀ yín tó kàn jáde",
    previewLabel: "Àfihàn ohun tí a ó tẹ̀ jáde",
    open: "Tẹ̀ ẹ́ jáde",
    opened: "Fèrèsé ìtẹ̀wé ti ṣí. Ẹ jọ̀wọ́ ẹ wo ẹ̀rọ ìtẹ̀wé fún ìwé yín.",
    notConfirmed: "A kò lè mọ̀ láti ibí bóyá ìwé náà ti jáde.",
    unavailable: "Ìtẹ̀wé kò ṣiṣẹ́ fún ìgbà díẹ̀.",
    nextStepHeading: "Ìgbésẹ̀ yín tó kàn",
    generalHeading: "Ó dára láti mọ̀",
    facilityHeading: "Ibi tí ẹ ó lọ",
    qrCaption: "Ẹ ya kóòdù yìí fún àlàyé sí i",
    qrMissing: "Kóòdù QR yóò hàn níbí nígbà tí ojú-ìwé àlàyé fún gbogbo ènìyàn bá ti wà.",
    footer:
      "Ètò yìí kì í ṣe ìdámọ̀ àìsàn. Ó ń ràn yín lọ́wọ́ láti lóye àwọn àmì tí ẹ ní, ó sì ń so yín pọ̀ mọ́ ìtọ́jú lọ́wọ́ akọ́ṣẹ́mọṣẹ́ ní kíákíá bí ó ti ṣeé ṣe.",
    smsInstead: "Fi ránṣẹ́ nípasẹ̀ SMS dípò rẹ̀",
  },

  session: {
    exitTitle: "Ṣé kí a parí, kí a sì pa àwọn ìdáhùn yín rẹ́?",
    exitText: "A ó pa àwọn ìdáhùn yín rẹ́, títí kan ohun tí ẹ fi pamọ́ sórí ẹ̀rọ yìí.",
    exitConfirm: "Bẹ́ẹ̀ ni, parí",
    exitStay: "Rárá, padà sẹ́yìn",
    idleTitle: "Ṣé ẹ ṣì wà níbẹ̀?",
    idleText: (seconds: number) => `Láti dáàbò bo àṣírí yín, ìgbà yìí yóò parí ní ìṣẹ́jú-àáyá ${seconds}.`,
    idleContinue: "Tẹ̀síwájú",
    idleFinish: "Parí báyìí",
  },

  notFound: {
    title: "A kò rí ojú-ìwé yẹn",
    text: "Ẹ jẹ́ kí a mú yín padà sí ìbẹ̀rẹ̀.",
  },
};

export const uiYoReview: ClinicalReview = {
  status: "draft",
  note: "AI-assisted draft (2026-10-23). Needs review by a fluent Yoruba speaker; health wording also by the clinical lead.",
};
