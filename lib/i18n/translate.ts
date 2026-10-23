import type { ClinicalReview } from "@/lib/types/clinical";
import type { Locale, LocalizedText } from "@/lib/types/locale";

/** Pure translation helpers: merging a partial table over English and finding gaps. */

export const LOCALES: Locale[] = ["en", "yo"];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

type Leaf = string | number | boolean | ((...args: never[]) => unknown) | readonly unknown[];

/** A translation table: any subset of the English structure. */
export type TranslationTable<T> = {
  [K in keyof T]?: T[K] extends Leaf ? T[K] : TranslationTable<T[K]>;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Uses the translated value wherever one exists and English everywhere else. */
export function mergeTranslations<T>(base: T, table: TranslationTable<T> | undefined): T {
  if (!table) return base;
  if (!isPlainObject(base)) return (table as unknown as T) ?? base;
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(table as Record<string, unknown>)) {
    if (value === undefined) continue;
    const original = (base as Record<string, unknown>)[key];
    result[key] = isPlainObject(original) && isPlainObject(value) ? mergeTranslations(original, value as never) : value;
  }
  return result as T;
}

/** Dotted paths of every English text that has no translation in the table. */
export function listMissingKeys(base: unknown, table: unknown, prefix = ""): string[] {
  if (!isPlainObject(base)) return table === undefined ? [prefix] : [];
  const missing: string[] = [];
  for (const [key, value] of Object.entries(base)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const translated = isPlainObject(table) ? table[key] : undefined;
    missing.push(...listMissingKeys(value, translated, path));
  }
  return missing;
}

export function countLeaves(base: unknown): number {
  return isPlainObject(base) ? Object.values(base).reduce<number>((sum, value) => sum + countLeaves(value), 0) : 1;
}

/**
 * Picks clinical text for a language. A translation is used only when its review is
 * approved; otherwise the English is returned and marked so it can be labelled.
 */
export function localize(
  text: LocalizedText,
  locale: Locale,
  translations?: Partial<Record<Exclude<Locale, "en">, ClinicalReview>>,
): { text: string; lang: Locale } {
  if (locale !== "en") {
    const translated = text[locale];
    if (translated && translations?.[locale]?.status === "approved") return { text: translated, lang: locale };
  }
  return { text: text.en, lang: "en" };
}
