/**
 * Spoken forms for generated Yoruba speech (Meta MMS, see lib/audio/mms.ts).
 *
 * The screen keeps showing the normal wording. This map gives, for a content id, the same
 * wording written the way it should be said: numbers as Yoruba words, symbols and English
 * terms spelt with letters the voice can read. For example:
 *
 *   "triage.results.outcomes.red.timeframe": "Lónìí, láàárín wákàtí mẹ́rìnlélógún",
 *
 * Every entry must be checked by a fluent Yoruba speaker (and the clinical lead for triage
 * and education text): a wrong number changes the guidance. `npm run audio:mms` lists the
 * texts that still need a spoken form; until one is added, that text has no generated
 * speech and Listen says Yoruba audio is unavailable for its screen.
 *
 * A spoken form is used only while the screen wording is unchanged: each entry is stored
 * with the version of the wording it was written for, and is ignored after an edit.
 */
export const spokenYo: Readonly<Record<string, { text: string; forVersion: string }>> = {};
