import { contentFor } from "@/lib/i18n/content";
import type { Locale } from "@/lib/types/locale";

/**
 * Every fixed text that can be read aloud, addressed by a stable content id that is the
 * same in both languages, for example:
 *
 *   triage.questions.R1.prompt          "Do you have a fever or chills right now?"
 *   triage.questions.R1.options.no      "No"
 *   triage.results.outcomes.red.body
 *   ui.home.title
 *   learn.know-your-breasts.vary.body
 *
 * Only fixed wording is in the catalogue: never a person's answers, numbers or summary.
 * Each text also has a version, a short hash of its current wording, so recordings and
 * cached speech made for older wording are never played.
 */

export interface SpeechText {
  text: string;
  /** Hash of the wording; changes whenever the text is edited. */
  version: string;
}

const MAX_SPEECH_CHARS = 1200;
const ID_PATTERN = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+){1,6}$/;

/** FNV-1a, 32-bit, as 8 hex characters. Enough to tell wording versions apart. */
export function textVersion(text: string): string {
  let hash = 0x811c9dc5;
  const bytes = new TextEncoder().encode(text.normalize("NFC"));
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function tree(locale: Locale): Record<string, unknown> {
  const content = contentFor(locale);
  const learn: Record<string, unknown> = {
    intro: content.education.intro,
    changesQuestion: content.education.changesQuestion,
  };
  for (const topic of content.education.modules) {
    learn[topic.slug] = {
      title: topic.title,
      summary: topic.summary,
      ...Object.fromEntries(topic.cards.map((card) => [card.id, card])),
    };
  }
  return { ui: content.ui, triage: content.triage, learn, safety: { text: content.safetyText } };
}

const trees: Partial<Record<Locale, Record<string, unknown>>> = {};

/** The current text for a content id, or null if the id is not a fixed text. */
export function speechText(locale: Locale, id: string): SpeechText | null {
  if (!ID_PATTERN.test(id)) return null;
  let node: unknown = (trees[locale] ??= tree(locale));
  for (const part of id.split(".")) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, part)) return null;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== "string" || !node.trim() || node.length > MAX_SPEECH_CHARS) return null;
  return { text: node, version: textVersion(node) };
}

/** Every content id with readable text, for tooling (recording lists, cache warming). */
export function allSpeechIds(locale: Locale): string[] {
  const ids: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node === "string") {
      if (speechText(locale, path)) ids.push(path);
    } else if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}.${index}`));
    } else if (typeof node === "object" && node !== null) {
      for (const [key, value] of Object.entries(node)) {
        // Staff-only text and non-content fields (ids, slugs, file names) are not read aloud.
        if (["dev", "id", "slug", "icon", "fileName", "logoAlt", "appName"].includes(key)) continue;
        // Review records (status, reviewer), but not the "review" result outcome.
        if (key === "review" && typeof value === "object" && value !== null && "status" in value) continue;
        walk(value, path ? `${path}.${key}` : key);
      }
    }
  };
  walk((trees[locale] ??= tree(locale)), "");
  return ids;
}
