import { buildPath, CONSENT_POLICY_VERSION, type Cursor, type Entry, type TriageState } from "./flow";
import { QUESTION_IDS, isValidAnswer, type TriageAnswers } from "./questions";

/**
 * Optional "Save my progress on this device". Answers live in memory unless the person
 * turns saving on; then they are kept in this browser's localStorage for at most 7 days.
 * Nothing is ever sent anywhere. Finish and the inactivity timeout delete the copy.
 */

export const SAVE_KEY = "earlyher.triage-progress";
export const SAVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FORMAT = 1;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SavedProgress {
  format: number;
  savedAt: number;
  expiresAt: number;
  state: TriageState;
}

/** The browser's storage, or null where it is blocked (private mode, kiosk policy). */
export function deviceStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Saves progress, but only when the person has turned saving on. Returns false if nothing was saved. */
export function saveProgress(storage: StorageLike | null, state: TriageState, now: number): boolean {
  if (!storage || !state.save) return false;
  const saved: SavedProgress = { format: FORMAT, savedAt: now, expiresAt: now + SAVE_TTL_MS, state };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(storage: StorageLike | null): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // Storage is unavailable, so there is nothing to delete.
  }
}

/** Loads saved progress. Expired, damaged or unrecognised copies are deleted and ignored. */
export function loadProgress(storage: StorageLike | null, now: number): TriageState | null {
  if (!storage) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const state = parse(raw, now);
  if (!state) clearProgress(storage);
  return state;
}

export function hasSavedProgress(storage: StorageLike | null, now: number): boolean {
  if (!storage) return false;
  try {
    const raw = storage.getItem(SAVE_KEY);
    return raw !== null && parse(raw, now) !== null;
  } catch {
    return false;
  }
}

function parse(raw: string, now: number): TriageState | null {
  let saved: Partial<SavedProgress>;
  try {
    saved = JSON.parse(raw);
  } catch {
    return null;
  }
  if (saved?.format !== FORMAT || typeof saved.expiresAt !== "number" || saved.expiresAt <= now) return null;
  const state = saved.state as Partial<TriageState> | undefined;
  if (!state || (state.entry !== "concern" && state.entry !== "no-concern")) return null;
  const consent = state.consent;
  if (!consent || typeof consent.acceptedAt !== "string" || consent.policyVersion !== CONSENT_POLICY_VERSION) return null;
  if (!state.save || typeof state.save.consentedAt !== "string") return null;

  const answers: Record<string, unknown> = {};
  for (const id of QUESTION_IDS) {
    const value = (state.answers as Record<string, unknown> | undefined)?.[id];
    if (isValidAnswer(id, value)) answers[id] = value;
  }
  const entry: Entry = state.entry;
  const continuedFrom = QUESTION_IDS.includes(state.continuedFrom as never) ? state.continuedFrom! : null;
  const restored: TriageState = {
    entry,
    consent: { acceptedAt: consent.acceptedAt, policyVersion: consent.policyVersion },
    answers: answers as TriageAnswers,
    cursor: "welcome",
    continuedFrom,
    save: { consentedAt: state.save.consentedAt },
  };
  // Resume at the furthest screen reached; the stored cursor is not trusted.
  const path = buildPath(restored);
  const cursor: Cursor = path.end === "deferred" ? "deferred" : path.end ? "result" : (path.screens.at(-1) ?? "welcome");
  return { ...restored, cursor };
}
