import { describe, expect, it, vi } from "vitest";
import { acceptConsent, createTriage, setAnswer } from "@/lib/triage/flow";
import { createSessionStore } from "./session-store";

function filledStore() {
  const store = createSessionStore();
  const triage = setAnswer(acceptConsent(createTriage("concern"), new Date()), "Q1", ["A"]);
  store.update({ triage, phoneDigits: "08031234567", arrivedWithoutConcern: true });
  return store;
}

describe("session reset", () => {
  it("clears answers, progress, phone number and navigation choices", () => {
    const store = filledStore();
    expect(store.hasData()).toBe(true);

    store.reset();

    expect(store.getState()).toMatchObject({
      triage: null,
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
