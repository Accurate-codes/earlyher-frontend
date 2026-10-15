import type { ClinicalReview, EducationModule } from "@/lib/types/clinical";

/**
 * English education modules. All wording is DRAFT from the product brief and is
 * pending clinical review. No screening schedules, urgency rules or medical detail
 * beyond the supplied text have been added.
 */

const draft: ClinicalReview = {
  status: "draft",
  note: "Supplied draft content pending clinical review.",
};

export const educationIntro = {
  greeting: "That's great. Knowing what is normal for you can help you notice changes early.",
  prompt: "What would you like to learn about?",
};

export const changesQuestion = "Have you noticed any of these changes?";

export const educationModules: EducationModule[] = [
  {
    slug: "know-your-breasts",
    title: "Know your breasts",
    summary: "What is normal is different for everyone.",
    icon: "heart",
    review: draft,
    cards: [
      {
        id: "vary",
        heading: "Everyone is different",
        body: "Breasts naturally vary between people.",
        audioKey: "learn.know-your-breasts.vary",
      },
      {
        id: "life-stages",
        heading: "Breasts change through life",
        body: "Breasts can change during different stages of life.",
        audioKey: "learn.know-your-breasts.life-stages",
      },
      {
        id: "normal-for-you",
        heading: "Know your normal",
        body: "Knowing what is normal for you can help you notice changes.",
        audioKey: "learn.know-your-breasts.normal-for-you",
      },
      {
        id: "attention",
        heading: "Notice what is new",
        body: "New or unusual changes deserve attention.",
        audioKey: "learn.know-your-breasts.attention",
      },
    ],
  },
  {
    slug: "changes-to-look-out-for",
    title: "Changes to look out for",
    summary: "Changes that are worth getting checked.",
    icon: "eye",
    review: draft,
    cards: [
      {
        id: "changes",
        heading: "Changes to look out for",
        points: [
          "A new lump or swelling",
          "Change in breast size or shape",
          "Skin changes",
          "Nipple changes",
          "Unusual nipple discharge",
          "Persistent or unusual breast discomfort",
          "Other changes from what is normal for you",
        ],
        audioKey: "learn.changes.list",
      },
      {
        id: "not-always-cancer",
        heading: "A change doesn't always mean cancer",
        body: "Many breast changes are caused by conditions that are not cancer.",
        callout: "But a new or unusual change should be checked by a healthcare professional.",
        audioKey: "learn.changes.not-always-cancer",
      },
      {
        id: "noticed",
        heading: changesQuestion,
        body: "If you have, we can ask a few questions to help you find your next step.",
        askAboutChanges: true,
        audioKey: "learn.changes.noticed",
      },
    ],
  },
  {
    slug: "healthy-breast-habits",
    title: "Healthy breast habits",
    summary: "Simple habits that help you stay aware.",
    icon: "leaf",
    review: draft,
    cards: [
      {
        id: "know-and-notice",
        heading: "Know and notice",
        points: ["Know what is normal for you.", "Pay attention to changes."],
        audioKey: "learn.habits.know-and-notice",
      },
      {
        id: "history",
        heading: "Know your history",
        body: "Understand relevant personal and family health history.",
        audioKey: "learn.habits.history",
      },
      {
        id: "advice",
        heading: "Ask a professional",
        points: [
          "Seek professional advice about new or persistent changes.",
          "Follow screening advice appropriate to your age, risk and location, as advised by a qualified professional.",
        ],
        audioKey: "learn.habits.advice",
      },
    ],
  },
  {
    slug: "when-to-see-a-healthcare-professional",
    title: "When to see a healthcare professional",
    summary: "When to ask for a check.",
    icon: "stethoscope",
    review: draft,
    cards: [
      {
        id: "speak",
        heading: "Speak with a healthcare professional",
        body: "If you notice a new or unusual change in your breast, it is important to speak with a healthcare professional.",
        audioKey: "learn.when.speak",
      },
      {
        id: "examine",
        heading: "What they can do",
        body: "They can examine you and decide whether you need further assessment or tests.",
        audioKey: "learn.when.examine",
      },
    ],
  },
];

export function getEducationModule(slug: string): EducationModule | null {
  return educationModules.find((module) => module.slug === slug) ?? null;
}
