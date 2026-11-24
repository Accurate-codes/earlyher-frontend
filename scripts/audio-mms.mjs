/**
 * Generates Yoruba speech for every text Listen reads, with Meta MMS (facebook/mms-tts-yor,
 * CC BY-NC 4.0), on this computer. No account, API key or server is needed.
 *
 *   npm install --prefix tools/audio-mms     once: the model runtime (about 150 MB)
 *   npm run audio:mms                        generate new and changed texts
 *   npm run audio:mms -- --only triage.results --limit 5
 *   npm run audio:mms -- --force             regenerate everything
 *
 * Writes public/audio/generated/yo/<content id>.<version>.mp3 and content/yo/generated-audio-map.ts.
 * Clips for older wording are deleted. Texts the voice cannot read correctly (numbers,
 * symbols, some English terms) are listed and skipped until a reviewed spoken form is added
 * to content/yo/spoken.ts. The first run downloads the model (about 40 MB) into
 * tools/audio-mms/.models. Progress is saved as it goes, so it can be stopped and rerun.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readAloudIds } from "./read-aloud.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const toolDir = path.join(root, "tools", "audio-mms");
const outDir = path.join(root, "public", "audio", "generated", "yo");
const mapFile = path.join(root, "content", "yo", "generated-audio-map.ts");

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const force = args.includes("--force");
const only = option("--only");
const limit = Number(option("--limit") ?? Infinity);

let transformers, lame;
try {
  const require = createRequire(path.join(toolDir, "package.json"));
  transformers = require("@huggingface/transformers");
  // The package's require() entry is a browser bundle; its ES module build works in Node.
  lame = await import(pathToFileURL(path.join(path.dirname(require.resolve("@breezystack/lamejs")), "lamejs.js")).href);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error("The MMS tool is not installed. Run once:  npm install --prefix tools/audio-mms");
  process.exit(1);
}

const { allSpeechIds, speechText } = await import("../lib/audio/speech-catalog.ts");
const { MMS_MODEL, unspeakable } = await import("../lib/audio/mms.ts");
const { spokenYo } = await import("../content/yo/spoken.ts");
const { generatedYo } = await import("../content/yo/generated-audio-map.ts");

const SAMPLE_RATE = 16000;
const GAP_SECONDS = 0.3;

function encodeMp3(samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  const encoder = new lame.Mp3Encoder(1, SAMPLE_RATE, 32);
  const parts = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const chunk = encoder.encodeBuffer(pcm.subarray(i, i + 1152));
    if (chunk.length) parts.push(Buffer.from(chunk));
  }
  const tail = encoder.flush();
  if (tail.length) parts.push(Buffer.from(tail));
  return Buffer.concat(parts);
}

/** Sentence by sentence, joined with short pauses: long inputs read more naturally this way. */
function sentences(text) {
  return text
    .split(/(?<=[.?!])\s+/u)
    .map((part) => part.trim())
    .filter((part) => /\p{L}/u.test(part));
}

function writeMap(map, order) {
  const lines = order.filter((id) => map[id]).map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(map[id])},`);
  const header = [
    "/**",
    " * Yoruba speech generated ahead of time with Meta MMS (facebook/mms-tts-yor, CC BY-NC 4.0).",
    " * Written by `npm run audio:mms`; do not edit by hand.",
    " *",
    " * Each line maps a content id to the version of the wording the clip was made from. The",
    " * file is /public/audio/generated/yo/<content id>.<version>.mp3. Listen plays it after any",
    " * reviewed recording and labels it as AI-generated. When the wording is edited its version",
    " * changes and the old clip is no longer played; run `npm run audio:mms` again.",
    " */",
  ].join("\n");
  const body = lines.length ? `{\n${lines.join("\n")}\n}` : "{}";
  writeFileSync(mapFile, `${header}\nexport const generatedYo: Readonly<Record<string, string>> = ${body};\n`, "utf8");
}

const ids = readAloudIds(allSpeechIds("yo"));
const map = {};
const todo = [];
const needsSpokenForm = [];
const fileFor = (id, version) => path.join(outDir, `${id}.${version}.mp3`);

for (const id of ids) {
  const { text, version } = speechText("yo", id);
  const spoken = spokenYo[id]?.forVersion === version ? spokenYo[id].text : text;
  const bad = unspeakable(spoken);
  if (bad.length) {
    needsSpokenForm.push({ id, text, bad });
    continue;
  }
  const done = generatedYo[id] === version && existsSync(fileFor(id, version));
  if (done && !force) map[id] = version;
  else if (!only || id.startsWith(only)) todo.push({ id, version, spoken });
  else if (done) map[id] = version;
}

const batch = todo.slice(0, limit);
console.log(`Yoruba texts read aloud: ${ids.length}`);
console.log(`  already generated: ${Object.keys(map).length}`);
console.log(`  to generate now: ${batch.length}${batch.length < todo.length ? ` (of ${todo.length})` : ""}`);
console.log(`  need a reviewed spoken form first: ${needsSpokenForm.length}`);

mkdirSync(outDir, { recursive: true });
if (batch.length) {
  transformers.env.cacheDir = path.join(toolDir, ".models");
  console.log(`Loading ${MMS_MODEL}...`);
  const tts = await transformers.pipeline("text-to-speech", MMS_MODEL, { dtype: "q8" });
  const started = Date.now();
  for (const [index, item] of batch.entries()) {
    const pieces = [];
    for (const sentence of sentences(item.spoken.normalize("NFC"))) {
      const output = await tts(sentence);
      if (output.sampling_rate !== SAMPLE_RATE) throw new Error(`Unexpected sampling rate ${output.sampling_rate}`);
      if (pieces.length) pieces.push(new Float32Array(Math.round(GAP_SECONDS * SAMPLE_RATE)));
      pieces.push(output.audio);
    }
    const samples = new Float32Array(pieces.reduce((sum, piece) => sum + piece.length, 0));
    let offset = 0;
    for (const piece of pieces) {
      samples.set(piece, offset);
      offset += piece.length;
    }
    writeFileSync(fileFor(item.id, item.version), encodeMp3(samples));
    map[item.id] = item.version;
    if (index % 10 === 9 || index === batch.length - 1) writeMap(map, ids);
    const eta = Math.round(((Date.now() - started) / (index + 1)) * (batch.length - index - 1) / 60000);
    console.log(`  [${index + 1}/${batch.length}] ${item.id} (${(samples.length / SAMPLE_RATE).toFixed(1)} s)${eta ? `, about ${eta} min left` : ""}`);
  }
}

// Clips for older wording, or for texts no longer read, are removed.
const keep = new Set(Object.entries(map).map(([id, version]) => `${id}.${version}.mp3`));
for (const name of readdirSync(outDir)) if (name.endsWith(".mp3") && !keep.has(name)) rmSync(path.join(outDir, name));
writeMap(map, ids);

if (needsSpokenForm.length) {
  console.log("\nNot generated: the voice would skip these characters. Add a reviewed spoken form to content/yo/spoken.ts:");
  for (const item of needsSpokenForm) {
    const version = speechText("yo", item.id).version;
    console.log(`  ${JSON.stringify(item.id)}  [${item.bad.join(" ")}]  forVersion "${version}"\n      ${item.text}`);
  }
}
console.log(`\nGenerated clips: ${Object.keys(map).length} of ${ids.length}. Written to content/yo/generated-audio-map.ts`);
