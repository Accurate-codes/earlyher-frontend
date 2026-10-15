import { describe, expect, it, vi } from "vitest";
import { lumpDemoPathway } from "@/content/pathways/lump.demo";
import type { ExplanationService } from "@/lib/services/ai-explanation";
import type { ExplanationResponse, ServiceResult } from "@/lib/types/api";
import { answerQuestion, chooseConcern, getReachedRecommendation, loadExplanation } from "./actions";
import { createSessionStore } from "./session-store";

function filledStore() {
  const store = createSessionStore();
  chooseConcern(store, "lump-or-swelling", lumpDemoPathway.id);
  answerQuestion(store, lumpDemoPathway, "lump-first-noticed", "1-4-weeks");
  store.update({ phoneDigits: "08031234567", areaId: "area-1", arrivedWithoutConcern: true });
  return store;
}

/** An explanation service whose reply is released by the test. */
function deferredService() {
  let release!: (result: ServiceResult<ExplanationResponse>) => void;
  let signal: AbortSignal | undefined;
  const service: ExplanationService = {
    explain: (_request, taskSignal) => {
      signal = taskSignal;
      return new Promise((resolve) => (release = resolve));
    },
  };
  return { service, release: (result: ServiceResult<ExplanationResponse>) => release(result), getSignal: () => signal };
}

const completeAnswers = { "lump-first-noticed": "unsure", "lump-changed": "unchanged", "lump-painful": "no" };

describe("session reset", () => {
  it("clears answers, results, phone number and navigation choices", () => {
    const store = filledStore();
    store.update({ explanation: { status: "ready", text: "text", simulated: true } });
    expect(store.hasData()).toBe(true);

    store.reset();

    expect(store.getState()).toMatchObject({
      concernId: null,
      pathwayId: null,
      answers: {},
      editingQuestionId: null,
      explanation: { status: "idle" },
      phoneDigits: "",
      areaId: null,
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

describe("late responses", () => {
  it("does not restore an explanation into a session that has ended", async () => {
    const store = createSessionStore();
    chooseConcern(store, "lump-or-swelling", lumpDemoPathway.id);
    const { service, release, getSignal } = deferredService();

    const pending = loadExplanation(store, service, lumpDemoPathway, "speak-to-professional");
    expect(store.getState().explanation.status).toBe("loading");

    store.reset();
    expect(getSignal()?.aborted).toBe(true);

    release({ ok: true, data: { explanation: "Late text from the previous person's session." }, simulated: false });
    await pending;

    expect(store.getState().explanation).toEqual({ status: "idle" });
    expect(store.hasData()).toBe(false);
  });

  it("ignores a reply to a request that newer answers have superseded", async () => {
    const store = createSessionStore();
    chooseConcern(store, "lump-or-swelling", lumpDemoPathway.id);
    const { service, release } = deferredService();

    const pending = loadExplanation(store, service, lumpDemoPathway, "speak-to-professional");
    answerQuestion(store, lumpDemoPathway, "lump-first-noticed", "unsure");

    release({ ok: true, data: { explanation: "Reply to the earlier answers." }, simulated: false });
    await pending;

    expect(store.getState().explanation).toEqual({ status: "idle" });
  });
});

describe("AI explanation never controls the recommendation", () => {
  it("keeps the pathway's recommendation whether the explanation succeeds or fails", async () => {
    for (const result of [
      { ok: true, data: { explanation: "Extra wording." }, simulated: false },
      { ok: false, error: "timeout" },
      { ok: false, error: "invalid-response" },
      { ok: false, error: "server" },
      { ok: false, error: "offline" },
    ] satisfies ServiceResult<ExplanationResponse>[]) {
      const store = createSessionStore();
      chooseConcern(store, "lump-or-swelling", lumpDemoPathway.id);
      store.update({ answers: completeAnswers });
      const before = getReachedRecommendation(lumpDemoPathway, store.getState().answers);

      await loadExplanation(store, { explain: async () => result }, lumpDemoPathway, "speak-to-professional");

      const after = getReachedRecommendation(lumpDemoPathway, store.getState().answers);
      expect(after).toEqual(before);
      expect(after?.id).toBe("speak-to-professional");
      expect(store.getState().explanation.status).toBe(result.ok ? "ready" : "unavailable");
    }
  });

  it("falls back when the service throws", async () => {
    const store = createSessionStore();
    const service: ExplanationService = { explain: () => Promise.reject(new Error("network down")) };

    await loadExplanation(store, service, lumpDemoPathway, "speak-to-professional");

    expect(store.getState().explanation).toEqual({ status: "unavailable", reason: "error" });
  });

  it("sends identifiers only, never answers or phone numbers", async () => {
    const store = filledStore();
    const explain = vi.fn<ExplanationService["explain"]>(async () => ({ ok: false, error: "server" }));

    await loadExplanation(store, { explain }, lumpDemoPathway, "speak-to-professional");

    expect(explain.mock.calls[0][0]).toEqual({
      recommendationId: "speak-to-professional",
      pathwayId: lumpDemoPathway.id,
      pathwayVersion: lumpDemoPathway.version,
      questionBankVersion: lumpDemoPathway.questionBankVersion,
      locale: "en",
    });
  });

  it("has no recommendation until the pathway reaches an outcome", () => {
    expect(getReachedRecommendation(lumpDemoPathway, { "lump-first-noticed": "unsure" })).toBeNull();
    expect(getReachedRecommendation(null, completeAnswers)).toBeNull();
  });
});
