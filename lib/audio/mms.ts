/**
 * Meta MMS Yoruba text-to-speech (facebook/mms-tts-yor, run as Xenova/mms-tts-yor with
 * transformers.js by `npm run audio:mms`). Licence: CC BY-NC 4.0, non-commercial use only.
 *
 * The model reads only the characters in its vocabulary (lower-case Yoruba letters, tone
 * marks, space, apostrophe and hyphen). Anything else is silently skipped, so
 * "láàárín wákàtí 24" would be read as "within hours". A text with a digit, symbol or
 * letter the model cannot say is therefore not generated until a reviewed spoken form is
 * added to content/yo/spoken.ts.
 */

export const MMS_MODEL = "Xenova/mms-tts-yor";
export const MMS_VOICE = "mms-tts-yor";

/** The model's vocabulary (vocab.json), after lower-casing as its tokenizer does. */
const VOCAB = new Set([..."abdefghijklmnoprstuwy àáèéìíòóùúńǹṣẹọ'-—", "̀", "́"]);

/** Skipped by the model but harmless: they only mark pauses. */
const PAUSES = /[\s.,;:!?"“”‘’()…]/u;

/** The characters in a text that the model would skip and that carry meaning; empty if it can be read. */
export function unspeakable(text: string): string[] {
  const found = new Set<string>();
  for (const char of text.normalize("NFC").toLowerCase()) {
    if (!VOCAB.has(char) && !PAUSES.test(char)) found.add(char);
  }
  return [...found];
}
