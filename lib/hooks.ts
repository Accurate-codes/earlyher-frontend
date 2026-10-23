"use client";

import { useSyncExternalStore } from "react";
import { triageText, type TriageText } from "@/content/en/triage";
import { ui, type UiText } from "@/content/en/ui";
import { triageYo, triageYoReview } from "@/content/yo/triage";
import { uiYo, uiYoReview } from "@/content/yo/ui";
import { audioController } from "@/lib/audio/audio-controller";
import { localeStore } from "@/lib/i18n/locale-store";
import { listMissingKeys, mergeTranslations } from "@/lib/i18n/translate";
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

const yoUi = mergeTranslations(ui, uiYo);
// Triage wording carries clinical meaning, so Yoruba is used only once it is complete and approved.
const yoTriageReady = listMissingKeys(triageText, triageYo).length === 0 && triageYoReview.status === "approved";
const yoTriage = yoTriageReady ? mergeTranslations(triageText, triageYo) : triageText;
const yoComplete = listMissingKeys(ui, uiYo).length === 0 && uiYoReview.status === "approved" && yoTriageReady;

/**
 * Interface text in the chosen language. Untranslated keys fall back to English;
 * `fallback` is true whenever that happens so the screen can say so.
 */
export function useUi(): { ui: UiText; locale: Locale; fallback: boolean } {
  const locale = useLocale();
  if (locale === "yo") return { ui: yoUi, locale, fallback: !yoComplete };
  return { ui, locale, fallback: false };
}

/**
 * Triage wording in the chosen language, with the language it is actually in. Both
 * languages run the same rules; only the wording changes.
 */
export function useTriageText(): { text: TriageText; lang: Locale } {
  const locale = useLocale();
  if (locale === "yo" && yoTriageReady) return { text: yoTriage, lang: "yo" };
  return { text: triageText, lang: "en" };
}
