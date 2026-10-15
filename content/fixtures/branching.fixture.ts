import type { Pathway } from "@/lib/types/clinical";

/**
 * DEVELOPMENT FIXTURE — NOT CLINICAL CONTENT.
 * Neutral placeholder questions used to exercise conditional branching, stale-answer
 * removal and progress reporting. Kept apart from `content/pathways` so it can never
 * be mistaken for, or shipped as, a clinical pathway.
 *
 * Shape:
 *   start ─ "long"  → detail-a → detail-b ─┐
 *         └ "short" ───────────────────────┴→ shared → (end)
 */
export const branchingFixturePathway: Pathway = {
  id: "dev-branching-fixture",
  version: "fixture-1",
  questionBankVersion: "fixture-1",
  title: "Interface test (not clinical)",
  concernIds: [],
  review: { status: "draft", note: "Development fixture. Must never be reviewed or published as clinical content." },
  developmentFixture: true,
  startQuestionId: "start",
  questions: {
    start: {
      id: "start",
      topic: "other",
      prompt: "Test question 1: which route should this test follow?",
      help: "This is a layout test. It is not a health question.",
      options: [
        { id: "long", label: "The longer route (two extra questions)" },
        { id: "short", label: "The shorter route" },
        { id: "unsure", label: "I'm not sure", kind: "unsure" },
      ],
      routes: [
        { when: { questionId: "start", anyOf: ["long"] }, goTo: { question: "detail-a" } },
        { goTo: { question: "shared" } },
      ],
    },
    "detail-a": {
      id: "detail-a",
      topic: "other",
      prompt: "Test question A: this only appears on the longer route.",
      options: [
        { id: "one", label: "Option one" },
        { id: "two", label: "Option two" },
      ],
      routes: [{ goTo: { question: "detail-b" } }],
    },
    "detail-b": {
      id: "detail-b",
      topic: "other",
      prompt: "Test question B: this also only appears on the longer route.",
      options: [
        { id: "one", label: "Option one" },
        { id: "two", label: "Option two" },
      ],
      routes: [{ goTo: { question: "shared" } }],
    },
    shared: {
      id: "shared",
      topic: "other",
      prompt: "Final test question: both routes end here.",
      options: [
        { id: "one", label: "Option one" },
        { id: "two", label: "Option two" },
      ],
      routes: [{ goTo: { outcome: "fixture-end" } }],
    },
  },
  outcomes: {
    "fixture-end": { id: "fixture-end", recommendationId: "speak-to-professional" },
  },
};
