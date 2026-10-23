import type { TriageState } from "@/lib/triage/flow";

/**
 * Temporary, in-memory session. Nothing here is written to cookies or the URL. The
 * triage answers are copied to localStorage only when the person turns on "Save my
 * progress on this device" (lib/triage/persistence.ts), and that copy is deleted on reset.
 */

export interface SessionState {
  /** Increases on every reset. Work started in an earlier epoch must not write to the session. */
  epoch: number;
  /** The breast-concern or self-check journey in progress. Never sent or logged. */
  triage: TriageState | null;
  /** Digits typed for the optional SMS. Cleared on reset. */
  phoneDigits: string;
  /** True when the person arrived at education by saying they have no concern. */
  arrivedWithoutConcern: boolean;
}

export interface SessionTask {
  /** Aborts when the session is reset. Pass to fetch and other cancellable work. */
  signal: AbortSignal;
  /** False once the session that started this task has ended. */
  isCurrent: () => boolean;
  /** Call when the task settles so its controller can be released. */
  done: () => void;
}

type Listener = () => void;
type Cleanup = () => void;

function initialState(epoch: number): SessionState {
  return {
    epoch,
    triage: null,
    phoneDigits: "",
    arrivedWithoutConcern: false,
  };
}

export function createSessionStore() {
  let state = initialState(0);
  const listeners = new Set<Listener>();
  const controllers = new Set<AbortController>();
  const cleanups = new Set<Cleanup>();

  function emit() {
    for (const listener of listeners) listener();
  }

  return {
    getState: () => state,

    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Applies a change to the current session. */
    update(patch: Partial<Omit<SessionState, "epoch">>) {
      state = { ...state, ...patch };
      emit();
    },

    /**
     * Applies a change only if the session it was prepared for is still running.
     * Returns false when a late response was discarded.
     */
    updateIfCurrent(epoch: number, patch: Partial<Omit<SessionState, "epoch">>): boolean {
      if (epoch !== state.epoch) return false;
      state = { ...state, ...patch };
      emit();
      return true;
    },

    /** Starts cancellable work tied to this session. */
    startTask(): SessionTask {
      const controller = new AbortController();
      const epoch = state.epoch;
      controllers.add(controller);
      return {
        signal: controller.signal,
        isCurrent: () => epoch === state.epoch && !controller.signal.aborted,
        done: () => {
          controllers.delete(controller);
        },
      };
    },

    /**
     * Registers something that must be released when the session ends: a microphone
     * stream, a recording's object URL, audio playback. Returns a function that runs
     * the cleanup early and unregisters it.
     */
    registerCleanup(cleanup: Cleanup): () => void {
      cleanups.add(cleanup);
      return () => {
        if (cleanups.delete(cleanup)) cleanup();
      };
    },

    /** True when the session holds anything belonging to a person. */
    hasData(): boolean {
      return (
        state.triage !== null ||
        state.phoneDigits !== "" ||
        state.arrivedWithoutConcern
      );
    },

    /** Ends the session: cancels pending work, releases resources and clears all data. */
    reset() {
      for (const controller of controllers) controller.abort();
      controllers.clear();

      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch {
          // One failed release must not stop the rest of the session being cleared.
        }
      }
      cleanups.clear();

      state = initialState(state.epoch + 1);
      emit();
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;

/** The single session for this browser tab. */
export const sessionStore = createSessionStore();
