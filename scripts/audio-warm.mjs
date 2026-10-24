/**
 * Generates and caches the speech for every text Listen can read, once, so people do not
 * wait for (or pay for) generation on first use. Run against a running server that has a
 * speech provider configured:
 *
 *   npm run audio:warm -- yo http://localhost:3000
 *
 * Clips already cached are not generated again. After a wording change only the changed
 * texts are new. Requests are paced to stay under the endpoint's per-client limit.
 */
import { readAloudIds } from "./read-aloud.mjs";

const { allSpeechIds, speechText } = await import("../lib/audio/speech-catalog.ts");

const [lang = "yo", base = "http://localhost:3000"] = process.argv.slice(2);
const ids = readAloudIds(allSpeechIds(lang));

const status = await fetch(`${base}/api/speech`).then((response) => response.json());
if (!status.languages?.[lang]) {
  console.error(`The server at ${base} has no speech provider for "${lang}". Set SPEECH_PROVIDER and its key first.`);
  process.exit(1);
}
console.log(`Warming ${ids.length} texts in ${lang} with ${status.languages[lang].provider} (${status.languages[lang].voice})`);

const origin = new URL(base).origin;
let done = 0;
let failed = 0;
for (const id of ids) {
  const { version } = speechText(lang, id);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${base}/api/speech`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ lang, id, version }),
    });
    await response.arrayBuffer();
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 61_000));
      continue;
    }
    if (response.ok) done += 1;
    else {
      failed += 1;
      console.warn(`  ${id}: HTTP ${response.status}`);
    }
    break;
  }
}
console.log(`Done: ${done} ready, ${failed} failed.`);
