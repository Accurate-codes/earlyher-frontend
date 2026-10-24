"use client";

import { useSyncExternalStore } from "react";
import type { TriageText } from "@/content/en/triage";
import type { UiText } from "@/content/en/ui";
import { audioController } from "@/lib/audio/audio-controller";
import { localeStore } from "@/lib/i18n/locale-store";
import { contentFor, yorubaStatus, type LocaleContent } from "@/lib/i18n/content";
import { mockScenarios } from "@/lib/services/mock-scenarios";
import { sessionStore, type SessionState } from "@/lib/session/session-store";
import type { Locale } from "@/lib/types/locale";

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

/** The chosen interface language. English during server rendering and before hydration. */
export function useLocale(): Locale {
  return useSyncExternalStore(localeStore.subscribe, localeStore.get, localeStore.getServer);
}

const yoStatus = yorubaStatus();

/** All text for the chosen language (interface, triage, education, disclaimer). */
export function useContent(): LocaleContent {
  return contentFor(useLocale());
}

/**
 * Interface text in the chosen language. `fallback` is true when some text is still in
 * English; `draft` while the Yoruba wording awaits language and clinical review.
 */
export function useUi(): { ui: UiText; locale: Locale; fallback: boolean; draft: boolean } {
  const locale = useLocale();
  const { ui } = contentFor(locale);
  if (locale === "yo") return { ui, locale, fallback: yoStatus.missing.length > 0, draft: yoStatus.draft };
  return { ui, locale, fallback: false, draft: false };
}

/**
 * Triage wording in the chosen language. Both languages use the same question ids,
 * option ids and rules; only the wording changes.
 */
export function useTriageText(): { text: TriageText; lang: Locale } {
  const locale = useLocale();
  return { text: contentFor(locale).triage, lang: locale };
}

/** Whether Listen reads each new step of the check as it appears. */
export function useReadAlong(): boolean {
  return useSyncExternalStore(audioController.subscribe, audioController.getFollowing, audioController.getServerFollowing);
}

/** What audio this device and server can offer (voices, generated speech). */
export function useAudioSupport() {
  return useSyncExternalStore(audioController.subscribe, audioController.getSupport, audioController.getServerSupport);
}
