import { describe, expect, it } from "vitest";
import { questionnaireFixture } from "@/content/fixtures/questionnaire.fixture";
import { getConcernQuestionnaire } from "@/content/questionnaires";
import type { Questionnaire } from "@/lib/types/questionnaire";
import {
  evaluateUrgency,
  firstUnanswered,
  isAnswered,
  pruneAnswers,
  setAnswer,
  toggleOption,
  validateQuestionnaire,
  visibleQuestions,
} from "./engine";

const fixture = questionnaireFixture;
const ids = (answers: Record<string, string | string[]>) => visibleQuestions(fixture, answers).map((q) => q.id);
const q2 = fixture.questions.find((q) => q.id === "q2")!;

describe("visible questions", () => {
  it("asks follow-ups only when their condition holds", () => {
    expect(ids({})).toEqual(["q1", "q2", "q3"]);
    expect(ids({ q1: "yes" })).toEqual(["q1", "q1-follow", "q2", "q3"]);
    expect(ids({ q1: "unsure" })).toEqual(["q1", "q2", "q3"]);
  });

  it("supports conditions on several selected answers", () => {
    expect(ids({ q2: ["a", "b"] })).toContain("q2-follow");
    expect(ids({ q2: ["a", "c"] })).not.toContain("q2-follow");
  });
});

describe("answer changes", () => {
  it("removes answers to follow-ups that no longer apply", () => {
    const answers = { q1: "yes", "q1-follow": "one", q2: ["b"], "q2-follow": "no", q3: "yes" };
    expect(setAnswer(fixture, answers, "q1", "no")).toEqual({ q1: "no", q2: ["b"], "q2-follow": "no", q3: "yes" });
    expect(setAnswer(fixture, answers, "q2", ["a"])).toEqual({ q1: "yes", "q1-follow": "one", q2: ["a"], q3: "yes" });
  });

  it("clears an answer when given undefined or no selections", () => {
    expect(setAnswer(fixture, { q1: "no" }, "q1", undefined)).toEqual({});
    expect(setAnswer(fixture, { q2: ["a"] }, "q2", [])).toEqual({});
  });

  it("drops answers that are not valid options", () => {
    expect(pruneAnswers(fixture, { q1: "maybe", q3: "yes", stray: "x" })).toEqual({ q3: "yes" });
  });

  it("makes an exclusive option clear the others, and the others clear it", () => {
    expect(toggleOption(q2, ["a", "b"], "none")).toEqual(["none"]);
    expect(toggleOption(q2, ["none"], "a")).toEqual(["a"]);
    expect(toggleOption(q2, ["a"], "a")).toEqual([]);
    expect(isAnswered(q2, ["a", "none"])).toBe(false);
  });
});

describe("required answers", () => {
  it("finds the first required question without an answer, skipping optional ones", () => {
    expect(firstUnanswered(fixture, {})?.id).toBe("q1");
    expect(firstUnanswered(fixture, { q1: "yes", q2: ["b"] })?.id).toBe("q1-follow");
    expect(firstUnanswered(fixture, { q1: "no", q2: ["b"], q3: "no" })).toBeNull();
  });
});

describe("urgency", () => {
  it("is never decided while answers are incomplete", () => {
    expect(evaluateUrgency(fixture, { q1: "no" })).toEqual({ status: "incomplete" });
  });

  it("follows declared rules in order (development fixture only)", () => {
    const yes = evaluateUrgency(fixture, { q1: "no", q2: ["a"], q3: "yes" });
    const no = evaluateUrgency(fixture, { q1: "no", q2: ["a"], q3: "no" });
    expect(yes).toMatchObject({ status: "level", ruleId: "fixture-q3-yes" });
    expect(no).toMatchObject({ status: "level", ruleId: "fixture-default" });
  });

  it("stays pending for clinical content until both the questions and the rules are approved", () => {
    const clinical: Questionnaire = { ...fixture, developmentFixture: false, review: { status: "approved" } };
    const answers = { q1: "no", q2: ["a"], q3: "yes" };
    expect(evaluateUrgency(clinical, answers)).toEqual({ status: "pending" });
    const approvedRules = { ...clinical, urgency: { ...clinical.urgency!, review: { status: "approved" as const } } };
    expect(evaluateUrgency(approvedRules, answers)).toMatchObject({ status: "level" });
    const { urgency: _omit, ...withoutRules } = clinical;
    void _omit;
    expect(evaluateUrgency(withoutRules, answers)).toEqual({ status: "pending" });
  });
});

describe("validation", () => {
  it("accepts the fixture", () => {
    expect(validateQuestionnaire(fixture)).toEqual([]);
  });

  it("rejects conditions on later or unknown questions, unknown answers and missing defaults", () => {
    const broken: Questionnaire = {
      ...fixture,
      questions: [
        { id: "a", type: "yes-no-unsure", required: true, prompt: { en: "A" }, showIf: { questionId: "b", anyOf: ["yes"] } },
        { id: "b", type: "yes-no-unsure", required: true, prompt: { en: "B" }, showIf: { questionId: "a", anyOf: ["perhaps"] } },
        { id: "b", type: "single", required: true, prompt: { en: "dup" }, options: [{ id: "x", label: { en: "x" } }] },
      ],
      urgency: { ...fixture.urgency!, rules: [{ id: "r", when: { questionId: "a", anyOf: ["yes"] }, levelId: "missing" }] },
    };
    const problems = validateQuestionnaire(broken).join("\n");
    expect(problems).toMatch(/not an earlier question/);
    expect(problems).toMatch(/unknown answer "perhaps"/);
    expect(problems).toMatch(/Duplicate question id "b"/);
    expect(problems).toMatch(/at least two options/);
    expect(problems).toMatch(/default rule/);
    expect(problems).toMatch(/unknown level/);
  });
});

describe("shipped content", () => {
  it("offers no clinical questionnaire until approved content is installed", () => {
    expect(getConcernQuestionnaire()).toBeNull();
  });
});
