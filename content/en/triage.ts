import type { OptionOf, QuestionId } from "@/lib/triage/questions";
import type { AdviceKey, Outcome, ReasonKey } from "@/lib/triage/rules";

/**
 * English wording for the breast-concern triage: questions, helpers, results and the
 * doctor summary. Question and result wording comes from the working triage
 * specification; text marked DRAFTED in docs/clinical-review.md was written for this
 * implementation and needs clinical and language review. Yoruba text lives in
 * content/yo/triage.ts and is used only once its review is approved.
 *
 * Keep internal terms (rule ids, flags, "Yellow", clinical-review notes) out of here:
 * everything in this file can appear on a user's screen.
 */

type QuestionText<Q extends QuestionId> = {
  prompt: string;
  helper?: string;
  /** Short label used in the doctor summary. */
  summary: string;
  options: Record<OptionOf<Q>, string>;
};

const yesNo = { yes: "Yes", no: "No" } as const;
const yesNoUnknown = { yes: "Yes", no: "No", unknown: "I don't know" } as const;

const quadrants = {
  upperOuter: "Upper outer",
  upperInner: "Upper inner",
  lowerOuter: "Lower outer",
  lowerInner: "Lower inner",
  nipple: "Behind the nipple",
  unsure: "I'm not sure",
} as const;

const questions: { [Q in QuestionId]: QuestionText<Q> } = {
  Q1: {
    prompt: "What brings you here today?",
    summary: "Reason for visit",
    options: {
      A: "I found a lump or thick area",
      B: "Fluid is coming from my nipple",
      C: "My breast hurts",
      D: "The skin or nipple on my breast looks different",
      N: "I have no concern. I just want to check in",
    },
  },
  Q1b: {
    prompt: "How old are you?",
    summary: "Age",
    options: { under25: "Under 25", "25to39": "25 to 39", "40to49": "40 to 49", "50to69": "50 to 69", "70plus": "70 or older" },
  },
  N1: {
    prompt: "Do you check your breasts yourself?",
    summary: "Checks own breasts",
    options: { monthly: "Every month", sometimes: "Now and then", never: "Never" },
  },
  N2: {
    prompt: "Do you see any change in your breasts?",
    helper:
      "Stand in front of a mirror. Look with your arms at your sides. Then press your hands on your hips. Then raise your arms over your head. Look for dimpling or puckering, redness, a nipple pulled inward, or one breast that looks different from the other.",
    summary: "Change seen in the mirror",
    options: { normal: "No, everything looks normal", change: "Yes, I see a change", unsure: "I'm not sure" },
  },
  N3: {
    prompt: "Do you feel any lump or thick area?",
    helper:
      "Lie down with one arm over your head. Use the flat of your three middle fingers. Press in small circles, from the nipple out to the edge of the breast, and up into the armpit. Do both sides. Press lightly, then a bit harder.",
    summary: "Lump or thick area felt",
    options: {
      normal: "No, nothing feels different",
      something: "Yes, I feel something",
      unsure: "I'm not sure",
      later: "I'll do this later",
    },
  },
  N4: {
    prompt: "When did a health worker last examine your breasts?",
    summary: "Last breast examination by a health worker",
    options: {
      lastYear: "In the last year",
      "1to2years": "1 to 2 years ago",
      over2years: "More than 2 years ago",
      never: "Never",
      dontRemember: "I don't remember",
    },
  },
  R1: {
    prompt: "Do you have a fever or chills right now?",
    helper: "A fever is a temperature of 38°C (100.4°F) or higher, or feeling hot and shivery.",
    summary: "Fever or chills",
    options: { yes: "Yes", no: "No", feverish: "I haven't checked, but I feel feverish" },
  },
  R2: {
    prompt: "Is part of your breast red, hot, swollen, or very painful?",
    summary: "Red, hot, swollen or very painful area",
    options: { recent: "Yes, it started in the last few days", weeks: "Yes, it has been there for weeks", no: "No" },
  },
  R3: {
    prompt: "Are you pregnant or breastfeeding?",
    helper: "Include if you stopped breastfeeding in the last 12 months.",
    summary: "Pregnancy or breastfeeding",
    options: {
      pregnant: "I'm pregnant",
      breastfeeding: "I'm breastfeeding",
      stopped: "I stopped breastfeeding in the last 12 months",
      none: "None of these",
    },
  },
  R4: {
    prompt: "In the last month, have you had any of these?",
    summary: "Other changes in the last month",
    options: {
      weightLoss: "Weight loss I can't explain",
      bonePain: "Bone pain",
      headaches: "Headaches that won't go away",
      vision: "Changes in my vision",
      none: "None of these",
    },
  },
  R5: {
    prompt: "Have you had a knock or injury to your chest lately?",
    summary: "Knock or injury to the chest",
    options: { recent: "Yes, in the last 2 weeks", earlier: "Yes, more than 2 weeks ago", no: "No" },
  },
  A1: {
    prompt: "Which side is the lump on?",
    summary: "Side",
    options: { right: "Right breast", left: "Left breast", both: "Both breasts", armpit: "In or near my armpit" },
  },
  A2R: {
    prompt: "Where in your right breast is it?",
    helper: "Outer means toward your armpit. Choose on the picture or from the list.",
    summary: "Where in the right breast",
    options: quadrants,
  },
  A2L: {
    prompt: "Where in your left breast is it?",
    helper: "Outer means toward your armpit. Choose on the picture or from the list.",
    summary: "Where in the left breast",
    options: quadrants,
  },
  A3: {
    prompt: "When did you first notice it?",
    summary: "First noticed",
    options: {
      lt1week: "Less than 1 week ago",
      "1to2weeks": "1 to 2 weeks ago",
      gt2weeks: "More than 2 weeks ago",
      gt1month: "More than a month ago",
    },
  },
  A4: {
    prompt: "Has it changed since you first noticed it?",
    summary: "Change since first noticed",
    options: { bigger: "It got bigger", different: "It feels different", same: "It's the same", smaller: "It got smaller" },
  },
  A5: {
    prompt: "Does the lump get bigger or sore before your period, then ease afterwards?",
    summary: "Changes with periods",
    options: { yes: "Yes", no: "No", noPeriods: "I don't have periods", unsure: "I'm not sure" },
  },
  A6: {
    prompt: "How does the lump feel?",
    helper: "Press gently. Soft feels like your earlobe. Firm feels like the tip of your nose. Hard feels like your forehead.",
    summary: "How it feels",
    options: { soft: "Soft or squishy", rubbery: "Rubbery", firm: "Firm", hard: "Hard like a stone", unsure: "I'm not sure" },
  },
  A7: {
    prompt: "What are the edges of the lump like?",
    helper: "Can you trace a clear outline, like a marble, or does it blend into the tissue around it?",
    summary: "Edges",
    options: { smooth: "Smooth, with a clear outline", uneven: "Uneven, hard to trace", unsure: "I'm not sure" },
  },
  A8: {
    prompt: "When you press on it, does it move under your fingers?",
    summary: "Movement",
    options: { moves: "It moves freely", stuck: "It feels stuck", unsure: "I'm not sure" },
  },
  A9: {
    prompt: "Have you had a breast lump, a cyst drained, or a biopsy before?",
    summary: "Previous lump, drained cyst or biopsy",
    options: { harmless: "Yes, and I was told it was harmless", unknownResult: "Yes, but I don't know the result", no: "No" },
  },
  B1: {
    prompt: "Does the fluid come out on its own?",
    helper: "For example, does it stain your bra or nightclothes without you touching your breast?",
    summary: "Comes out on its own",
    options: { yes: "Yes, it comes out on its own", squeeze: "Only when I squeeze or press", unsure: "I'm not sure" },
  },
  B2: {
    prompt: "Is the fluid coming from one breast or both?",
    summary: "One or both breasts",
    options: { one: "One breast", both: "Both breasts" },
  },
  B2side: {
    prompt: "Which breast?",
    summary: "Which breast",
    options: { right: "Right", left: "Left" },
  },
  B3: {
    prompt: "Does the fluid come from one tiny opening, or from several?",
    helper: "The nipple has several tiny openings. Fluid may come from just one of them, or from a few.",
    summary: "Openings",
    options: { one: "One opening", several: "Several openings", cantTell: "I can't tell" },
  },
  B4: {
    prompt: "What color is the fluid?",
    summary: "Colour",
    options: {
      clear: "Clear and watery",
      pink: "Pink",
      bloody: "Bloody or red",
      milky: "Milky",
      coloured: "Green, yellow, brown, or thick",
    },
  },
  B5: {
    prompt: "Do you also have a lump, a thick area, or a change in your nipple?",
    summary: "Also a lump, thick area or nipple change",
    options: yesNo,
  },
  B6: {
    prompt: "With the fluid, have you had headaches that won't go away, changes in your vision, or missed periods?",
    summary: "Headaches, vision changes or missed periods",
    options: { yes: "Yes", no: "No", noPeriods: "I don't have periods" },
  },
  B6b: {
    prompt: "Have you had headaches that won't go away, or changes in your vision?",
    summary: "Headaches or vision changes",
    options: yesNo,
  },
  B7: {
    prompt: "Do you take any of these medicines?",
    summary: "Medicines",
    options: {
      antidepressants: "Antidepressants or mood medicines",
      antipsychotics: "Antipsychotic medicines",
      bloodPressure: "Blood pressure medicines",
      hormones: "Birth control or hormone pills",
      strongPainkillers: "Strong painkillers like codeine or morphine",
      antacids: "Heartburn or stomach acid medicines",
      none: "None of these",
      unsure: "I'm not sure",
    },
  },
  B8: {
    prompt: "Is the nipple area red, hot, or very painful?",
    summary: "Nipple area red, hot or very painful",
    options: yesNo,
  },
  C1: {
    prompt: "Does the pain come and go with your period?",
    helper: "Many people feel breast pain or heaviness before a period that eases once it starts.",
    summary: "Comes and goes with periods",
    options: { yes: "Yes", no: "No", noPeriods: "I don't have periods" },
  },
  C2: {
    prompt: "Where do you feel the pain?",
    summary: "Where",
    options: { both: "Across both breasts", oneBreast: "All over one breast", oneSpot: "In one small spot" },
  },
  C3: {
    prompt: "How strong is the pain?",
    summary: "Strength",
    options: { mild: "Mild, 0 to 3", medium: "Medium, 4 to 6", strong: "Strong, 7 to 10" },
  },
  C3b: {
    prompt: "Does it stop you from sleeping or doing your daily activities?",
    summary: "Stops sleep or daily activities",
    options: yesNo,
  },
  C4: {
    prompt: "How long have you had the pain?",
    summary: "How long",
    options: { lt2weeks: "Less than 2 weeks", "2to6weeks": "2 to 6 weeks", gt6weeks: "More than 6 weeks" },
  },
  C5: {
    prompt: "Does the pain spread to your armpit, arm, or chest?",
    summary: "Spreads to armpit, arm or chest",
    options: yesNo,
  },
  C6: {
    prompt: "Is the painful area red, hot, or swollen?",
    summary: "Painful area red, hot or swollen",
    options: yesNo,
  },
  C7: {
    prompt: "Do you also have any of these?",
    summary: "Also noticed",
    options: { A: "A lump or thick area", B: "Fluid from the nipple", D: "A change in the skin or nipple", none: "None of these" },
  },
  D1: {
    prompt: "What changes do you see or feel?",
    summary: "Changes",
    options: {
      dimpling: "Dimples or puckering in the skin",
      orangePeel: "Skin that looks like orange peel, or feels thick",
      redness: "Redness",
      swelling: "Swelling, or one breast feels heavier",
      warm: "The breast feels warm",
      inversion: "My nipple has newly turned inward or pulled in",
      scaly: "Scaly, crusty, or itchy skin on my nipple or the dark area around it",
      none: "None of these",
    },
  },
  D2: {
    prompt: "How long have you noticed it?",
    summary: "Noticed for",
    options: { lt1week: "Less than 1 week", "1to4weeks": "1 to 4 weeks", gt4weeks: "More than 4 weeks" },
  },
  D3: {
    prompt: "Is it spreading or getting worse?",
    summary: "Spreading or getting worse",
    options: { yes: "Yes", no: "No", unsure: "I'm not sure" },
  },
  D4: {
    prompt: "Has your nipple always turned inward?",
    summary: "Nipple always turned inward",
    options: { always: "Yes, since I was young", new: "No, it's new" },
  },
  D5: {
    prompt: "Do you have eczema or dry skin anywhere else, and does it clear with cream?",
    summary: "Eczema or dry skin elsewhere",
    options: {
      clears: "Yes, and it clears with cream",
      doesNotClear: "Yes, but it does not clear",
      noEczema: "No, I have no eczema anywhere else",
    },
  },
  D6: {
    prompt: "Do you also have a lump or fluid from the nipple?",
    summary: "Also noticed",
    options: { A: "A lump or thick area", B: "Fluid from the nipple", none: "None of these" },
  },
  H1: {
    prompt: "Has your mother, sister, or daughter had breast or ovarian cancer?",
    summary: "Mother, sister or daughter with breast or ovarian cancer",
    options: yesNoUnknown,
  },
  H1b: {
    prompt: "How old was she when it was found?",
    summary: "Her age when it was found",
    options: { under40: "Under 40", "40to49": "40 to 49", "50plus": "50 or older", unknown: "I don't know" },
  },
  H2: {
    prompt: "Do you or anyone in your family have a known gene change, such as BRCA1, BRCA2, or PALB2?",
    helper:
      "Genes are instructions passed down in families. A change in some genes can be found with a special blood test. If no one has told you about this, choose \"No\" or \"I don't know\".",
    summary: "Known gene change in the family",
    options: yesNoUnknown,
  },
  H3: {
    prompt: "Did you have radiation treatment to your chest before you turned 30?",
    helper: "For example, treatment for lymphoma.",
    summary: "Chest radiation before age 30",
    options: yesNoUnknown,
  },
  H4: {
    prompt: "Have you had breast cancer, or a biopsy that showed \"atypical\" cells or LCIS?",
    helper: "\"Atypical\" and \"LCIS\" are words that may appear on a biopsy report. If you're not sure, choose \"I don't know\".",
    summary: "Previous breast cancer, or atypical cells or LCIS on a biopsy",
    options: yesNoUnknown,
  },
  H5: {
    prompt: "When was your last mammogram or breast ultrasound, and what did it show?",
    summary: "Last mammogram or breast ultrasound",
    options: {
      lastYearNormal: "In the last year, normal",
      "1to2yearsNormal": "1 to 2 years ago, normal",
      followUp: "It needed a follow-up",
      never: "I've never had one",
      dontRemember: "I don't remember",
    },
  },
};

type OutcomeText = { label: string; timeframe: string; headline: string; body: string };

const outcomes: Record<Outcome, OutcomeText> = {
  red: {
    label: "Urgent",
    timeframe: "Today, within 24 hours",
    headline: "Get seen today",
    body: "What you've told us can be a sign of infection or another problem that needs treatment now. Please see a doctor today, or go to the nearest urgent care or emergency room. If you have trouble breathing or chest pain, call your local emergency number straight away.",
  },
  orange: {
    label: "Soon",
    timeframe: "Within 1 week",
    headline: "See a doctor this week",
    body: "The changes you described need to be checked by a doctor within the next week. These answers do not tell us what is causing the change. A proper examination, and sometimes a scan, can help explain it.",
  },
  yellow: {
    label: "Within 4 weeks",
    timeframe: "Within the next 4 weeks",
    headline: "Book a visit soon",
    body: "Please arrange a visit within the next 4 weeks so a health professional can check what you described. If it gets bigger, hurts more, or you notice anything new, seek care sooner.",
  },
  green: {
    label: "Routine",
    timeframe: "Routine care",
    headline: "No urgent concern",
    body: "Your answers do not point to a need for urgent care. This check cannot rule out every problem. If you notice a change or remain worried, speak with a health professional.",
  },
  review: {
    label: "Speak with a professional",
    timeframe: "Ask a health professional how soon to be seen",
    headline: "Talk to a health professional",
    body: "Some of your answers need a health professional's advice, and we can't suggest a timeframe for them here. Please contact a health professional, tell them what you described, and ask how soon you should be seen. If it gets bigger, hurts more, or you notice anything new, seek care sooner.",
  },
};

const reasons: Record<ReasonKey, string> = {
  inflamedFever: "You have a fever or feel feverish, and part of your breast is red, hot, swollen or very painful.",
  inflamed: "Part of your breast is red, hot, swollen or very painful.",
  nippleInflamedFever: "You have a fever or feel feverish, and your nipple area is red, hot or very painful.",
  nippleInflamed: "Your nipple area is red, hot or very painful.",
  pregnantLump: "You found a lump while pregnant or breastfeeding.",
  bodyChanges: "In the last month you've had weight loss you can't explain, bone pain, headaches that won't go away, or changes in your vision.",
  bodyChangesLump: "You found a lump and have also had other changes in your body in the last month.",
  armpitLump: "The lump is in or near your armpit.",
  lumpWeeks: "You first noticed the lump more than 2 weeks ago.",
  lumpChanged: "The lump has grown or feels different since you first noticed it.",
  lumpCyclic: "You noticed the lump recently, and it changes with your period.",
  lumpNotCyclic: "The lump does not come and go with a period.",
  lumpCycleUnsure: "You're not sure whether the lump changes with your period.",
  lumpHard: "The lump feels hard.",
  lumpFirm: "The lump feels firm.",
  lumpFeelUnsure: "You're not sure how the lump feels.",
  lumpEdges: "The edges of the lump are uneven or hard to trace.",
  lumpEdgesUnsure: "You're not sure what the edges of the lump are like.",
  lumpFixed: "The lump feels stuck in place.",
  lumpMoveUnsure: "You're not sure whether the lump moves.",
  lumpPastUnknown: "You've had a lump, a drained cyst or a biopsy before, and don't know the result.",
  fluidOwn: "Fluid comes from your nipple on its own.",
  fluidOneOpening: "Fluid comes from one opening in one breast, and it may come out on its own.",
  fluidBloody: "The fluid is pink, red or bloody.",
  fluidClearOwn: "Clear fluid comes out of one breast on its own.",
  fluidMilky: "Milky fluid comes from both breasts when you squeeze.",
  fluidThick: "Thick or coloured fluid comes from several openings.",
  fluidCheck: "The colour and pattern of the fluid you described should be checked.",
  fluidWithOther: "Along with the fluid, you have a lump, thick area or nipple change.",
  fluidHormone: "Along with the fluid, you've had headaches, vision changes or missed periods.",
  painStrong: "Your pain is strong or stops you sleeping or doing daily activities, and it doesn't follow your period.",
  painLasting: "Your pain has lasted 2 weeks or more and doesn't follow your period.",
  painSpotLasting: "Your pain is in one small spot and has lasted 2 weeks or more.",
  skinDimpling: "You noticed dimples or puckering in the skin.",
  skinOrangePeel: "The skin looks like orange peel or feels thick.",
  skinRedness: "Part of your breast is red.",
  skinSwelling: "Your breast is swollen or feels heavier.",
  skinWarm: "Your breast feels warm.",
  nippleInversion: "Your nipple has newly turned inward.",
  nippleScaly: "The skin on or around your nipple is scaly, crusty or itchy, and does not match eczema that clears with cream.",
  nippleScalyClears: "The skin on or around your nipple is scaly or itchy, and you have eczema elsewhere that clears with cream.",
  changeWorse: "The change is spreading or getting worse.",
  severalSigns: "Several of your answers together mean it's best to be checked within a week.",
  historyPlus: "You described a change, and your family or health history means it's best to be checked sooner.",
  historyGreen: "You told us about family or health history that may affect when you should be screened.",
  injuryPain: "Your pain began after a recent knock to your chest, and you didn't describe other warning signs.",
  noWarningSigns: "Your answers did not match the signs that need a visit soon.",
  selfCheckNormal: "You told us your breasts look and feel as usual for you.",
  priorScanFollowUp: "Your last scan needed a follow-up.",
};

const advice: Record<AdviceKey, string> = {
  recheckAfterPeriod: "Check the lump again after your next period. If it is still there, book a visit.",
  hormoneCheck:
    "Tell the doctor about the headaches, vision changes or missed periods. They may suggest a blood test to check your hormones.",
  bringMedicines: "Bring a list of all your medicines.",
  mammogram: "Ask your doctor how often you should have a mammogram.",
  screening: "Because of your family or health history, ask your doctor about earlier or more frequent screening.",
  routineCheck: "It's time to book a routine breast check.",
  monthlySelfCheck: "Checking your breasts once a month helps you know what is normal for you.",
};

export const triageText = {
  welcome: {
    concernTitle: "Let's check your breast concern together",
    noConcernTitle: "Let's do a breast check-in together",
    body: "Answer a few simple questions. At the end, we'll explain how soon to seek care and show your next steps.",
    consent:
      "By continuing, you agree that EarlyHer can use your answers to guide you and, only if you choose, share them with a doctor.",
    privacyLink: "Read how EarlyHer handles your answers",
    agree: "I agree and start",
    continue: "Continue",
    emergency: "Chest pain or trouble breathing? Call your local emergency number now.",
    emergencyCall: (number: string) => `Call ${number}`,
    resumeTitle: "You have saved progress on this device",
    resumeText: "You can carry on where you left off, or start again. Starting again deletes the saved answers.",
    resume: "Continue where you left off",
    startAgain: "Start again",
    noIdentity: "We won't ask for your name, phone number or email.",
  },

  stages: {
    about: "About you",
    safety: "Safety check",
    symptom: "Your symptom",
    history: "Your history",
  },
  stageProgress: (current: string, position: number, total: number) => `${current}. Part ${position} of ${total}.`,
  stagesLabel: "Progress",
  stageDone: "done",
  stageCurrent: "current",

  nav: {
    continue: "Continue",
    back: "Back",
    chooseOne: "Choose one answer.",
    chooseAll: "Choose all that apply.",
    required: "Please choose an answer to continue.",
    requiredMulti: "Please choose at least one answer to continue.",
    requiredFollowUp: "Please answer both parts to continue.",
    optional: "Optional",
    switchToConcern: "I have a concern",
    switchToConcernText: "Noticed something already?",
    questionAnnouncement: (stage: string, prompt: string) => `${stage}: ${prompt}`,
  },

  footer: {
    text: "This is guidance, not a diagnosis. If you are worried at any point, you can seek care.",
    findCare: "Find care",
  },

  helpNow: {
    button: "I need help now",
    title: "Get help now",
    text: "If you are very unwell, or worried about your breast right now, please don't wait. See a doctor today, or go to the nearest urgent care or emergency room.",
    emergency: "If you have trouble breathing or chest pain, call your local emergency number straight away.",
    findCare: "Find care near me now",
    talk: "Talk to a clinician now",
    back: "Back to my questions",
    kept: "Your answers are kept if you come back.",
  },

  questions,
  painInjuryHelper: "A knock can cause soreness or bruising that fades in a few weeks.",

  illustrations: {
    mirrorPositions: ["Arms at your sides", "Hands on hips", "Arms over your head"],
    mirror: "Three ways to stand in front of a mirror: arms at your sides, hands pressed on hips, and arms raised over your head.",
    lyingDown: "Lying down with one arm over the head, using the flat of three middle fingers to press in small circles.",
    breastDiagram: (side: string) =>
      `Picture of the ${side} breast divided into four areas around the nipple. The armpit side is labelled. You can also choose from the list.`,
    armpitSide: "Armpit side",
    middleSide: "Middle of chest",
    right: "right",
    left: "left",
    openings: "A nipple with one tiny opening, and a nipple with several tiny openings.",
    oneOpening: "One opening",
    severalOpenings: "Several openings",
  },

  selfCheck: {
    guideButton: "See what to look for",
    guideTitle: "What to look for",
    guideIntro: "Get to know how your breasts usually look and feel. Look and feel for:",
    signs: [
      "Dimpling or puckering of the skin",
      "Redness",
      "A nipple pulled inward",
      "One breast that looks different from the other",
      "A lump or thick area, in the breast or up into the armpit",
    ],
    guideOutro: "If you notice any of these, or anything that is new for you, choose \"Yes\" or \"I'm not sure\" and we'll ask a few more questions.",
    deferredTitle: "You can finish this check later",
    deferredText:
      "When you have a private moment, lie down and check for any lump or thick area. Then come back to answer the last questions.",
    reminderTomorrow: "Add a reminder for tomorrow",
    reminderNote: "This adds an event to your own calendar. EarlyHer does not send reminders.",
    backToQuestion: "Back to the question",
    learn: "Learn about breast health",
  },

  results: {
    title: "Your next steps",
    ready: "Your next steps are ready",
    howSoon: "How soon to seek care",
    reasonsHeading: "What informed this guidance",
    moreReasons: (count: number) => `${count} more ${count === 1 ? "answer" : "answers"} are listed in your summary.`,
    nextHeading: "What to do next",
    careHeading: "Ways to get care",
    bringHeading: "What to bring",
    bring: [
      "When you first noticed the change, and how it has changed since",
      "Results of any previous scans or biopsies",
      "A list of all your medicines",
    ],
    outcomes,
    reasons,
    advice,
    incompleteTitle: "You can answer more questions later",
    incompleteText:
      "We stopped the questions early because you need care today. If you have time, answering a few more questions can help your doctor. Getting care comes first.",
    continueQuestions: "Answer a few more questions for your doctor",
    actions: {
      findCareNow: "Find care near me now",
      talkNow: "Talk to a clinician now",
      findFacility: "Find a healthcare facility",
      talkDoctor: "Talk to a doctor",
      findCare: "Find care",
      routineCare: "Find routine healthcare",
      book: "Book an appointment this week",
      bookVisit: "Book a visit",
      summary: "Download my summary",
      viewSummary: "See my summary",
      recheckReminder: "Add a reminder to recheck in 2 weeks",
      monthlyReminder: "Add a monthly self-check reminder",
      selfCheckGuide: "Self-check guide",
      learn: "Learn about breast health",
    },
    telemedicineUnavailable: "Online consultations are not available through EarlyHer yet.",
    reminderNote: "Reminders are added to your own calendar. EarlyHer does not send reminders.",
    backToAnswers: "Back to my answers",
    noResult: {
      title: "There are no next steps to show",
      text: "For your privacy, answers are cleared when a session ends. You can start again whenever you are ready.",
    },
    concern: "I have a concern",
  },

  booking: {
    noSlot: "We couldn't find a visit in time. Please contact a healthcare provider for another option.",
    unavailable: "Online booking is not available through EarlyHer yet. You can find a facility and contact it directly.",
  },

  finderContext: {
    heading: "Your guidance",
    windowNote:
      "Being listed here does not mean a facility can see you within this time. Please contact the facility or go in person to check.",
    redNote: "If it's an emergency, go to the nearest urgent care or emergency room.",
    backToResult: "Back to my result",
    backToQuestions: "Back to my questions",
  },

  summary: {
    title: "Your summary",
    intro: "This page lists what you told us, so you don't have to explain it all again.",
    generated: (date: string) => `Created on ${date}`,
    urgency: "Guidance",
    reasons: "Why",
    incomplete: "Some questions were not answered because care is needed today.",
    notAsked: "Not asked",
    locationLabel: "Where in the breast",
    sections: {
      about: "About you",
      safety: "Safety check",
      lump: "Lump or thick area",
      fluid: "Nipple fluid",
      pain: "Breast pain",
      skin: "Skin or nipple changes",
      selfCheck: "Self-check",
      history: "History",
    },
    notAskedReasons: {
      A2: "Not asked, because the lump is in or near the armpit",
      A4: "Not asked, because it was noticed less than 1 week ago",
      B8: "Already answered in the safety check",
      C6: "Already answered in the safety check",
    },
    download: "Download PDF",
    share: "Share",
    shareNote: "Sharing opens your device's share options. Nothing is sent unless you choose where to send it.",
    shareFailed: "Sharing didn't work on this device. You can download the PDF instead.",
    downloadFailed: "The PDF could not be created. Please try again.",
    backToResult: "Back to my result",
    pdfTitle: "EarlyHer summary",
    pdfDisclaimer: "This is guidance, not a diagnosis. These answers do not say what is causing the change.",
    /** Shown only when another language is selected. */
    pdfInEnglish: "The PDF is in English, so any doctor can read it. It cannot show Yoruba tone marks yet.",
    fileName: "health-summary.pdf",
  },

  save: {
    label: "Save my progress on this device",
    help: "Anyone who uses this device could see saved answers. They are deleted after 7 days, when you press Finish, or if the screen is left unused.",
    saved: "Your progress is saved on this device.",
    delete: "Delete saved answers",
    deleted: "Saved answers deleted.",
    unavailable: "This device can't save progress.",
  },

  privacy: {
    title: "How EarlyHer handles your answers",
    intro: "This page explains what happens to the answers you give during a check.",
    points: [
      "Your answers are used on this device to work out how soon to seek care and to show your next steps. The guidance rules run in the app; your answers are not sent to a server.",
      "We don't ask for your name, phone number or email during the check.",
      "Your answers are kept in this page's memory. They are cleared when you press Finish, when the screen is left unused for a few minutes, or when you close or reload the page.",
      "If you choose \"Save my progress on this device\", your answers are stored in this browser for up to 7 days so you can come back. Anyone who uses this device could see them, so don't save on a shared device. You can delete them at any time.",
      "Your answers are shared only if you choose to, for example by downloading or sharing your summary.",
      "If Listen uses an online voice (for example for Yoruba), the app asks the speech service for the fixed wording on the screen, such as a question or a result explanation. Your answers and summary are never sent, and EarlyHer does not record these requests.",
      "If you choose \"Use my location\" on the healthcare finder, your location is used on that screen only. It is not saved or sent anywhere.",
    ],
    pending: "EarlyHer's full privacy policy will be linked here once it is published.",
    back: "Back",
  },

  calendar: {
    selfCheckTitle: "EarlyHer: breast self-check",
    selfCheckText: "Lie down and check both breasts for any lump or thick area, then finish your EarlyHer check.",
    recheckTitle: "EarlyHer: recheck",
    recheckText: "Check again. If it is still there, or it has changed, book a visit.",
    monthlyTitle: "EarlyHer: monthly breast check",
    monthlyText: "Look and feel for any change in your breasts.",
    fileName: "reminder.ics",
  },
};

export type TriageText = typeof triageText;
