/**
 * Which outcome each mock adapter produces. Reviewers switch these from the
 * demo-state panel to see every loading, failure and empty state without a backend.
 */

export interface MockScenarios {
  ai: "success" | "timeout" | "invalid" | "error";
  sms: "accepted" | "queued" | "failure";
  /** "snapshot" loads the real Lagos snapshot; the others simulate failures for review. */
  facilities: "snapshot" | "empty" | "unavailable" | "offline" | "error";
  printer: "unknown" | "unavailable";
}

const defaults: MockScenarios = {
  ai: "success",
  sms: "accepted",
  facilities: "snapshot",
  printer: "unknown",
};

let current: MockScenarios = { ...defaults };
const listeners = new Set<() => void>();

export const mockScenarios = {
  get: (): MockScenarios => current,
  set(patch: Partial<MockScenarios>) {
    current = { ...current, ...patch };
    for (const listener of listeners) listener();
  },
  reset() {
    this.set(defaults);
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
