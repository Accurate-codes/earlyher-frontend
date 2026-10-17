import type { Locale } from "@/lib/types/questionnaire";
import { DEFAULT_LOCALE, isLocale } from "./translate";

/**
 * The chosen interface language. It is a display preference, not personal health data,
 * so it is remembered in this browser (when storage is available) and survives Finish.
 */

const STORAGE_KEY = "earlyher.locale";

let current: Locale = DEFAULT_LOCALE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) current = saved;
  } catch {
    // Storage can be blocked; the default language still works.
  }
}

export const localeStore = {
  get(): Locale {
    load();
    return current;
  },
  getServer(): Locale {
    return DEFAULT_LOCALE;
  },
  set(locale: Locale) {
    current = locale;
    loaded = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Not remembered after a reload, but kept for this visit.
    }
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
