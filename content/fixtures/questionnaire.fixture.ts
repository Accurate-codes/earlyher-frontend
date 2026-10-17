import type { Questionnaire } from "@/lib/types/questionnaire";

/**
 * DEVELOPMENT FIXTURE — NOT CLINICAL CONTENT.
 * Neutral placeholder questions that exercise every questionnaire feature: Yes / No /
 * I don't know, several selections, conditional follow-ups, clearing follow-ups when an
 * earlier answer changes, required validation, review and the result layout.
 * Only reachable when NEXT_PUBLIC_SHOW_DEV_FIXTURES is on (default in `next dev`).
 *
 *   q1 (yes/no/unsure) ── yes ──> q1-follow (single)
 *   q2 (multiple) ── "b" chosen ──> q2-follow (yes/no/unsure, optional)
 *   q3 (yes/no/unsure)
 */
export const questionnaireFixture: Questionnaire = {
  id: "dev-questionnaire-fixture",
  version: "fixture-1",
  review: { status: "draft", note: "Development fixture. Must never be reviewed or published as clinical content." },
  developmentFixture: true,
  questions: [
    {
      id: "q1",
      type: "yes-no-unsure",
      required: true,
      prompt: { en: "Test question 1: show the follow-up question?" },
      help: { en: "Layout test only. This is not a health question." },
    },
    {
      id: "q1-follow",
      type: "single",
      required: true,
      showIf: { questionId: "q1", anyOf: ["yes"] },
      prompt: { en: "Test follow-up: appears only after “Yes” to test question 1." },
      options: [
        { id: "one", label: { en: "Option one" } },
        { id: "two", label: { en: "Option two" } },
        { id: "unsure", label: { en: "I don't know" }, kind: "unsure" },
      ],
    },
    {
      id: "q2",
      type: "multiple",
      required: true,
      prompt: { en: "Test question 2: choose one or more." },
      help: { en: "Choosing “Option B” adds an optional follow-up." },
      options: [
        { id: "a", label: { en: "Option A" } },
        { id: "b", label: { en: "Option B" } },
        { id: "c", label: { en: "Option C" } },
        { id: "none", label: { en: "None of these" }, kind: "exclusive" },
      ],
    },
    {
      id: "q2-follow",
      type: "yes-no-unsure",
      required: false,
      showIf: { questionId: "q2", anyOf: ["b"] },
      prompt: { en: "Optional test follow-up for Option B." },
    },
    {
      id: "q3",
      type: "yes-no-unsure",
      required: true,
      prompt: { en: "Test question 3: last question." },
    },
  ],
  urgency: {
    version: "fixture-1",
    review: { status: "draft", note: "Fixture rules. Not clinical." },
    levels: {
      "test-a": {
        id: "test-a",
        tone: "soon",
        title: { en: "Test result A" },
        description: { en: "Layout test: shown when test question 3 is “Yes”." },
      },
      "test-b": {
        id: "test-b",
        tone: "routine",
        title: { en: "Test result B" },
        description: { en: "Layout test: the default fixture result." },
      },
    },
    rules: [
      { id: "fixture-q3-yes", when: { questionId: "q3", anyOf: ["yes"] }, levelId: "test-a" },
      { id: "fixture-default", levelId: "test-b" },
    ],
  },
};
