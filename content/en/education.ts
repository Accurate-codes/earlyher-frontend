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
      },
      {
        id: "life-stages",
        heading: "Breasts change through life",
        body: "Breasts can change during different stages of life.",
      },
      {
        id: "normal-for-you",
        heading: "Know your normal",
        body: "Knowing what is normal for you can help you notice changes.",
      },
      {
        id: "attention",
        heading: "Notice what is new",
        body: "New or unusual changes deserve attention.",
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
      },
      {
        id: "noticed",
        heading: changesQuestion,
        body: "If you have, we can ask a few questions to help you find your next step.",
        askAboutChanges: true,
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
      },
      {
        id: "history",
        heading: "Know your history",
        body: "Understand relevant personal and family health history.",
      },
      {
        id: "advice",
        heading: "Ask a professional",
        points: [
          "Seek professional advice about new or persistent changes.",
          "Follow screening advice appropriate to your age, risk and location, as advised by a qualified professional.",
        ],
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
      },
      {
        id: "examine",
        heading: "What they can do",
        body: "They can examine you and decide whether you need further assessment or tests.",
      },
    ],
  },
];

export function getEducationModule(slug: string): EducationModule | null {
  return educationModules.find((module) => module.slug === slug) ?? null;
}
