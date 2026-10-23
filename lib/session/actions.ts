import { createTriage, switchEntry, type Entry, type TriageState } from "@/lib/triage/flow";
import { clearProgress, deviceStorage, saveProgress, type StorageLike } from "@/lib/triage/persistence";
import type { SessionStore } from "./session-store";

/**
 * Triage session changes shared by the screens. Kept free of React so they can be
 * tested directly. Answers stay in memory and are copied to this device only while the
 * person has chosen to save their progress; nothing here sends or logs them.
 */

/** Stores the new triage state, and keeps the saved copy in step when saving is on. */
export function commitTriage(store: SessionStore, next: TriageState, storage: StorageLike | null = deviceStorage()) {
  store.update({ triage: next, arrivedWithoutConcern: next.entry === "no-concern" });
  if (next.save) saveProgress(storage, next, Date.now());
}

/** Applies a pure triage change. Returns false when the change was refused (for example, a screen still needs an answer). */
export function updateTriage(
  store: SessionStore,
  change: (state: TriageState) => TriageState | null,
  storage: StorageLike | null = deviceStorage(),
): boolean {
  const current = store.getState().triage;
  if (!current) return false;
  const next = change(current);
  if (!next || next === current) return false;
  commitTriage(store, next, storage);
  return true;
}

/** The journey for an entry button: the one in progress (switching path if needed), or a new one. */
export function triageFor(store: SessionStore, entry: Entry): TriageState {
  const current = store.getState().triage;
  return current ? switchEntry(current, entry) : createTriage(entry);
}

/** Turns "Save my progress on this device" on or off. Turning it off deletes the saved copy. */
export function setSaveOnDevice(
  store: SessionStore,
  enabled: boolean,
  now: Date,
  storage: StorageLike | null = deviceStorage(),
) {
  const current = store.getState().triage;
  if (!current) return;
  if (enabled) {
    commitTriage(store, { ...current, save: { consentedAt: now.toISOString() } }, storage);
  } else {
    clearProgress(storage);
    store.update({ triage: { ...current, save: null } });
  }
}
