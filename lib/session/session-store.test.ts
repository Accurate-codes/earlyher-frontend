import { describe, expect, it, vi } from "vitest";
import { questionnaireFixture } from "@/content/fixtures/questionnaire.fixture";
import { answerQuestion, canContinue, startQuestionnaire, stepAfter, stepBefore, submitAnswers } from "./actions";
import { createSessionStore } from "./session-store";

const fixture = questionnaireFixture;

function filledStore() {
  const store = createSessionStore();
  startQuestionnaire(store, fixture);
  answerQuestion(store, fixture, "q1", "yes");
  store.update({ phoneDigits: "08031234567", arrivedWithoutConcern: true });
  return store;
}

describe("session reset", () => {
  it("clears answers, progress, phone number and navigation choices", () => {
    const store = filledStore();
    store.update({ submitted: true });
    expect(store.hasData()).toBe(true);

    store.reset();

    expect(store.getState()).toMatchObject({
      questionnaireId: null,
      answers: {},
      step: null,
      submitted: false,
      phoneDigits: "",
      arrivedWithoutConcern: false,
    });
    expect(store.hasData()).toBe(false);
  });

  it("starts a new epoch and notifies subscribers", () => {
    const store = filledStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.getState().epoch;

    store.reset();

    expect(store.getState().epoch).toBe(before + 1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("cancels pending requests", () => {
    const store = filledStore();
    const task = store.startTask();
    expect(task.isCurrent()).toBe(true);

    store.reset();

    expect(task.signal.aborted).toBe(true);
    expect(task.isCurrent()).toBe(false);
  });

  it("releases recordings, microphone streams and audio exactly once", () => {
    const store = filledStore();
    const stopMicrophone = vi.fn();
    const revokeRecording = vi.fn();
    store.registerCleanup(stopMicrophone);
    store.registerCleanup(revokeRecording);

    store.reset();
    store.reset();

    expect(stopMicrophone).toHaveBeenCalledTimes(1);
    expect(revokeRecording).toHaveBeenCalledTimes(1);
  });

  it("still clears everything when one cleanup throws", () => {
    const store = filledStore();
    const second = vi.fn();
    store.registerCleanup(() => {
      throw new Error("device error");
    });
    store.registerCleanup(second);

    expect(() => store.reset()).not.toThrow();
    expect(second).toHaveBeenCalled();
    expect(store.hasData()).toBe(false);
  });

  it("lets a resource be released early without running again at reset", () => {
    const store = createSessionStore();
    const cleanup = vi.fn();
    const release = store.registerCleanup(cleanup);

    release();
    store.reset();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("refuses updates prepared for an earlier session", () => {
    const store = filledStore();
    const oldEpoch = store.getState().epoch;
    store.reset();

    expect(store.updateIfCurrent(oldEpoch, { phoneDigits: "08031234567" })).toBe(false);
    expect(store.getState().phoneDigits).toBe("");
  });
});

describe("questionnaire session", () => {
  it("starts at the first question with no answers", () => {
    const store = createSessionStore();
    startQuestionnaire(store, fixture);
    expect(store.getState()).toMatchObject({ questionnaireId: fixture.id, answers: {}, step: { questionId: "q1" } });
  });

  it("keeps answers when moving back and forward", () => {
    const store = filledStore();
    const { answers } = store.getState();
    const next = stepAfter(fixture, answers, { questionId: "q1" });
    expect(next).toEqual({ questionId: "q1-follow" });
    expect(stepBefore(fixture, answers, next)).toEqual({ questionId: "q1" });
    expect(store.getState().answers.q1).toBe("yes");
  });

  it("skips a follow-up that does not apply", () => {
    const store = createSessionStore();
    startQuestionnaire(store, fixture);
    answerQuestion(store, fixture, "q1", "no");
    expect(stepAfter(fixture, store.getState().answers, { questionId: "q1" })).toEqual({ questionId: "q2" });
  });

  it("clears a follow-up answer when the earlier answer changes", () => {
    const store = filledStore();
    answerQuestion(store, fixture, "q1-follow", "one");
    expect(store.getState().answers["q1-follow"]).toBe("one");

    answerQuestion(store, fixture, "q1", "no");

    expect(store.getState().answers).toEqual({ q1: "no" });
  });

  it("goes from the last question to review, and back from review to the last question", () => {
    const store = createSessionStore();
    startQuestionnaire(store, fixture);
    const answers = { q1: "no", q2: ["a"], q3: "yes" };
    expect(stepAfter(fixture, answers, { questionId: "q3" })).toEqual({ review: true });
    expect(stepBefore(fixture, answers, { review: true })).toEqual({ questionId: "q3" });
    expect(stepBefore(fixture, answers, { questionId: "q1" })).toBeNull();
  });

  it("requires an answer before continuing, except for optional questions", () => {
    expect(canContinue(fixture, {}, "q1")).toBe(false);
    expect(canContinue(fixture, { q1: "unsure" }, "q1")).toBe(true);
    expect(canContinue(fixture, { q2: ["b"] }, "q2-follow")).toBe(true);
  });

  it("will not submit while a required question is unanswered", () => {
    const store = createSessionStore();
    startQuestionnaire(store, fixture);
    answerQuestion(store, fixture, "q1", "yes");
    answerQuestion(store, fixture, "q2", ["a"]);
    answerQuestion(store, fixture, "q3", "no");

    expect(submitAnswers(store, fixture)).toEqual({ ok: false, questionId: "q1-follow" });
    expect(store.getState().submitted).toBe(false);

    answerQuestion(store, fixture, "q1-follow", "two");
    expect(submitAnswers(store, fixture)).toEqual({ ok: true });
    expect(store.getState().submitted).toBe(true);
  });

  it("marks answers as not submitted again after any change", () => {
    const store = createSessionStore();
    startQuestionnaire(store, fixture);
    for (const [id, value] of Object.entries({ q1: "no", q2: ["c"], q3: "no" })) answerQuestion(store, fixture, id, value);
    submitAnswers(store, fixture);
    answerQuestion(store, fixture, "q3", "yes");
    expect(store.getState().submitted).toBe(false);
  });
});
