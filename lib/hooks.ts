"use client";

import { useSyncExternalStore } from "react";
import { audioController } from "@/lib/audio/audio-controller";
import { mockScenarios } from "@/lib/services/mock-scenarios";
import { sessionStore, type SessionState } from "@/lib/session/session-store";

export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState, sessionStore.getState);
}

export function useAudioState() {
  return useSyncExternalStore(audioController.subscribe, audioController.getState, audioController.getServerState);
}

export function useMockScenarios() {
  return useSyncExternalStore(mockScenarios.subscribe, mockScenarios.get, mockScenarios.get);
}

function subscribeToConnectivity(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/** Whether the device reports a network connection. Assumes online until the browser says otherwise. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeToConnectivity,
    () => navigator.onLine,
    () => true,
  );
}
