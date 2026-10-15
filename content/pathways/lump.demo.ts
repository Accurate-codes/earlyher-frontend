import type { Pathway } from "@/lib/types/clinical";

/**
 * DEMONSTRATION PATHWAY. The three questions are the examples supplied in the
 * product brief. They show how the question screen works; they are not a complete
 * or clinically approved lump pathway, and every route ends at the same draft
 * next step because no escalation rules have been supplied.
 *
 * To install a reviewed pathway: replace this file's content with the approved
 * questions and routes, bump `version` / `questionBankVersion`, and set `review`.
 */
export const lumpDemoPathway: Pathway = {
  id: "lump-or-swelling",
  version: "0.1.0-demo",
  questionBankVersion: "0.1.0-demo",
  title: "Lump or swelling",
  concernIds: ["lump-or-swelling"],
  review: {
    status: "draft",
    note: "Example questions from the product brief. Awaiting the clinical team's full question bank, branching rules and escalation criteria.",
  },
  startQuestionId: "lump-first-noticed",
  questions: {
    "lump-first-noticed": {
      id: "lump-first-noticed",
      topic: "onset-duration",
      prompt: "When did you first notice it?",
      audioKey: "question.lump-first-noticed",
      options: [
        { id: "under-1-week", label: "Less than 1 week ago" },
        { id: "1-4-weeks", label: "1–4 weeks ago" },
        { id: "1-3-months", label: "1–3 months ago" },
        { id: "over-3-months", label: "More than 3 months ago" },
        { id: "unsure", label: "I'm not sure", kind: "unsure" },
      ],
      routes: [{ goTo: { question: "lump-changed" } }],
    },
    "lump-changed": {
      id: "lump-changed",
      topic: "change-over-time",
      prompt: "Has the lump changed?",
      audioKey: "question.lump-changed",
      options: [
        { id: "bigger", label: "Getting bigger" },
        { id: "smaller", label: "Getting smaller" },
        { id: "unchanged", label: "Has not changed" },
        { id: "unsure", label: "I'm not sure", kind: "unsure" },
      ],
      routes: [{ goTo: { question: "lump-painful" } }],
    },
    "lump-painful": {
      id: "lump-painful",
      topic: "pain",
      prompt: "Is it painful?",
      audioKey: "question.lump-painful",
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
        { id: "unsure", label: "I'm not sure", kind: "unsure" },
      ],
      routes: [{ goTo: { outcome: "general-next-step" } }],
    },
  },
  outcomes: {
    "general-next-step": { id: "general-next-step", recommendationId: "speak-to-professional" },
  },
};
