/**
 * Maps content keys to approved recordings under /public/audio/en.
 *
 * No approved recordings have been supplied yet, so the map is empty and Listen
 * falls back to the device's own voice where one exists. To add a recording:
 *   1. Save the file as /public/audio/en/<name>.mp3
 *   2. Add a line here:  "welcome": "/audio/en/welcome.mp3",
 *   3. Add the same path to PRECACHE_URLS in /public/sw.js so it plays offline.
 *
 * Other languages get their own folder and map (for example content/yo/audio-map.ts).
 */
export const audioMap: Readonly<Record<string, string>> = {};
