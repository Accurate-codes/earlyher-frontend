/**
 * Yoruba text handling shared by the interface and speech.
 *
 * The app font has the Yoruba letters ẹ, ọ, ṣ, ń and the combining tone marks, but no
 * precomposed ǹ or ḿ. Those two are written as the letter plus a combining mark, which
 * the font positions correctly, so no character falls back to a different font.
 */

const DECOMPOSE: Record<string, string> = {
  "Ǹ": "Ǹ",
  "ǹ": "ǹ",
  "Ḿ": "Ḿ",
  "ḿ": "ḿ",
};

const PRECOMPOSED = /[ǸǹḾḿ]/g;

export function fitYorubaGlyphs(text: string): string {
  return text.normalize("NFC").replace(PRECOMPOSED, (char) => DECOMPOSE[char]);
}

/** Applies fitYorubaGlyphs to every string (and string-returning function) in a table. */
export function fitTable<T>(table: T): T {
  if (typeof table === "string") return fitYorubaGlyphs(table) as T;
  if (typeof table === "function") {
    const fn = table as unknown as (...args: unknown[]) => unknown;
    return ((...args: unknown[]) => fitTable(fn(...args))) as T;
  }
  if (Array.isArray(table)) return table.map((item) => fitTable(item)) as T;
  if (typeof table === "object" && table !== null) {
    return Object.fromEntries(Object.entries(table).map(([key, value]) => [key, fitTable(value)])) as T;
  }
  return table;
}
