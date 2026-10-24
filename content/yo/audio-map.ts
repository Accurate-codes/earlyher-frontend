/**
 * Reviewed Yoruba recordings. Listen plays these first, before any generated speech.
 *
 * Each line maps a content id to the version of the wording that was recorded:
 *
 *   "triage.questions.R1.prompt": "3f9c0a12",
 *
 * The file for that line is /public/audio/yo/triage.questions.R1.prompt.mp3 (the content
 * id plus .mp3). If the Yoruba wording is later edited, its version changes, the old
 * recording is no longer played, and `npm run audio:status` lists it as out of date.
 *
 * To add recordings:
 *   1. `npm run audio:status -- yo` lists every content id, its current wording, version
 *      and file name. It also writes the list to audio-scripts/yo.csv for the voice artist.
 *   2. Save each reviewed recording as public/audio/yo/<content id>.mp3.
 *   3. `npm run audio:status -- yo --register` adds every file that is present to this map
 *      at the current wording's version. Run it only after checking the recordings match
 *      the current wording.
 */
export const recordingsYo: Readonly<Record<string, string>> = {};
