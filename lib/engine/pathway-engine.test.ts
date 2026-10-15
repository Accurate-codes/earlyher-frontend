import { describe, expect, it } from "vitest";
import { branchingFixturePathway as fixture } from "@/content/fixtures/branching.fixture";
import { lumpDemoPathway } from "@/content/pathways/lump.demo";
import { ANSWER_NOT_LISTED, type Pathway } from "@/lib/types/clinical";
import { applyAnswer, getActivePath, getProgress, pruneAnswers, reopenQuestion, validatePathway } from "./pathway-engine";

describe("branching", () => {
  it("starts at the first question", () => {
    expect(getActivePath(fixture, {})).toEqual({ answeredQuestionIds: [], currentQuestionId: "start", outcomeId: null });
  });

  it("asks the follow-up questions only on the branch that needs them", () => {
    const long = applyAnswer(fixture, {}, "start", "long");
    expect(getActivePath(fixture, long).currentQuestionId).toBe("detail-a");

    const short = applyAnswer(fixture, {}, "start", "short");
    expect(getActivePath(fixture, short).currentQuestionId).toBe("shared");
  });

  it("sends 'I'm not sure' and 'not listed' down the default route", () => {
    expect(getActivePath(fixture, { start: "unsure" }).currentQuestionId).toBe("shared");
    expect(getActivePath(fixture, { start: ANSWER_NOT_LISTED }).currentQuestionId).toBe("shared");
  });

  it("reaches the outcome when the branch is complete", () => {
    const answers = { start: "long", "detail-a": "one", "detail-b": "two", shared: "one" };
    expect(getActivePath(fixture, answers)).toEqual({
      answeredQuestionIds: ["start", "detail-a", "detail-b", "shared"],
      currentQuestionId: null,
      outcomeId: "fixture-end",
    });
  });

  it("ignores an answer that is not one of the question's options", () => {
    expect(getActivePath(fixture, { start: "made-up" }).currentQuestionId).toBe("start");
    expect(() => applyAnswer(fixture, {}, "start", "made-up")).toThrow();
  });
});

describe("stale answer removal", () => {
  const longRoute = { start: "long", "detail-a": "one", "detail-b": "two", shared: "one" };

  it("removes follow-up answers when an earlier answer changes branch", () => {
    const changed = applyAnswer(fixture, longRoute, "start", "short");
    expect(changed).toEqual({ start: "short", shared: "one" });
    expect(changed).not.toHaveProperty("detail-a");
    expect(changed).not.toHaveProperty("detail-b");
  });

  it("keeps later answers that still apply", () => {
    const changed = applyAnswer(fixture, longRoute, "detail-a", "two");
    expect(changed).toEqual({ ...longRoute, "detail-a": "two" });
  });

  it("asks the new branch's questions after a change", () => {
    const short = { start: "short", shared: "two" };
    const changed = applyAnswer(fixture, short, "start", "long");
    expect(getActivePath(fixture, changed).currentQuestionId).toBe("detail-a");
    // "shared" is no longer reachable until the new branch is answered, so it is dropped.
    expect(changed).toEqual({ start: "long" });
  });

  it("drops answers that are off the active path", () => {
    expect(pruneAnswers(fixture, { start: "short", "detail-a": "one", unknown: "x" })).toEqual({ start: "short" });
  });

  it("reopening a question removes it and everything after it", () => {
    expect(reopenQuestion(fixture, longRoute, "detail-a")).toEqual({ start: "long" });
  });
});

describe("honest progress", () => {
  it("gives no total while the remaining length depends on the answer", () => {
    expect(getProgress(fixture, {})).toEqual({ position: 1, total: null });
  });

  it("gives a total once every remaining route has the same length", () => {
    expect(getProgress(fixture, { start: "long" })).toEqual({ position: 2, total: 4 });
    expect(getProgress(fixture, { start: "short" })).toEqual({ position: 2, total: 2 });
  });

  it("reports a fixed total for a linear pathway", () => {
    expect(getProgress(lumpDemoPathway, {})).toEqual({ position: 1, total: 3 });
  });

  it("has no progress once the pathway is finished", () => {
    expect(getProgress(fixture, { start: "short", shared: "one" })).toBeNull();
  });
});

describe("pathway validation", () => {
  it("accepts the shipped pathways", () => {
    expect(validatePathway(lumpDemoPathway)).toEqual([]);
    expect(validatePathway(fixture)).toEqual([]);
  });

  it("requires version fields and review status on shipped content", () => {
    expect(lumpDemoPathway.version).toBeTruthy();
    expect(lumpDemoPathway.questionBankVersion).toBeTruthy();
    expect(lumpDemoPathway.review.status).toBe("draft");
    expect(fixture.developmentFixture).toBe(true);
  });

  it("rejects a question without a default route", () => {
    const broken: Pathway = structuredClone(fixture);
    broken.questions.start.routes = [{ when: { questionId: "start", anyOf: ["long"] }, goTo: { question: "detail-a" } }];
    expect(validatePathway(broken).join(" ")).toMatch(/default route/);
  });

  it("rejects routes to questions or outcomes that do not exist", () => {
    const broken: Pathway = structuredClone(fixture);
    broken.questions.shared.routes = [{ goTo: { outcome: "missing" } }];
    broken.questions["detail-b"].routes = [{ goTo: { question: "nowhere" } }];
    const problems = validatePathway(broken).join(" ");
    expect(problems).toMatch(/unknown outcome "missing"/);
    expect(problems).toMatch(/unknown question "nowhere"/);
  });

  it("rejects loops", () => {
    const broken: Pathway = structuredClone(fixture);
    broken.questions.shared.routes = [{ goTo: { question: "start" } }];
    expect(validatePathway(broken).join(" ")).toMatch(/loop/);
  });
});
