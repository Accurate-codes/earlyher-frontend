/**
 * Recording status for one language.
 *
 *   npm run audio:status -- yo              list recorded / outdated / missing clips
 *   npm run audio:status -- yo --register   add every file in public/audio/yo to
 *                                           content/yo/audio-map.ts at the current wording
 *
 * Also writes audio-scripts/<lang>.csv (content id, file name, version, status, wording)
 * to hand to a voice artist. Only the texts read by Listen are included.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readAloudIds } from "./read-aloud.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const lang = args.find((arg) => !arg.startsWith("--")) ?? "yo";
const register = args.includes("--register");
if (!["en", "yo"].includes(lang)) {
  console.error(`Unknown language "${lang}". Use en or yo.`);
  process.exit(1);
}

const { allSpeechIds, speechText } = await import("../lib/audio/speech-catalog.ts");
const mapFile = path.join(root, "content", lang, "audio-map.ts");
const map = await import(`../content/${lang}/audio-map.ts`);
const recordings = lang === "yo" ? map.recordingsYo : map.recordingsEn;
const audioDir = path.join(root, "public", "audio", lang);

const ids = readAloudIds(allSpeechIds(lang));

const files = existsSync(audioDir) ? readdirSync(audioDir).filter((name) => name.endsWith(".mp3")) : [];
const fileIds = new Set(files.map((name) => name.slice(0, -4)));

const rows = ids.map((id) => {
  const { text, version } = speechText(lang, id);
  const file = `${id}.mp3`;
  let status = "missing";
  if (recordings[id] === version && fileIds.has(id)) status = "recorded";
  else if (recordings[id] === version) status = "file-missing";
  else if (recordings[id]) status = "outdated";
  else if (fileIds.has(id)) status = "unregistered";
  return { id, file, version, status, text };
});

const csv = [
  "content_id,file,version,status,text",
  ...rows.map((row) => [row.id, row.file, row.version, row.status, row.text].map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")),
].join("\n");
mkdirSync(path.join(root, "audio-scripts"), { recursive: true });
writeFileSync(path.join(root, "audio-scripts", `${lang}.csv`), "﻿" + csv + "\n", "utf8");

const count = (status) => rows.filter((row) => row.status === status).length;
const orphans = files.filter((name) => !ids.includes(name.slice(0, -4)));
console.log(`Language: ${lang}   texts read aloud: ${rows.length}`);
console.log(`  recorded (current wording): ${count("recorded")}`);
console.log(`  outdated (wording changed, re-record): ${count("outdated")}`);
console.log(`  file present, not registered: ${count("unregistered")}`);
console.log(`  registered, file missing: ${count("file-missing")}`);
console.log(`  not recorded: ${count("missing")}`);
if (orphans.length) console.log(`  files that match no current text: ${orphans.join(", ")}`);
for (const row of rows.filter((r) => r.status === "outdated" || r.status === "file-missing")) console.log(`  ${row.status}: ${row.file}`);
console.log(`Wrote audio-scripts/${lang}.csv`);

if (register) {
  const entries = rows.filter((row) => fileIds.has(row.id)).map((row) => `  ${JSON.stringify(row.id)}: ${JSON.stringify(row.version)},`);
  const source = readFileSync(mapFile, "utf8");
  const name = lang === "yo" ? "recordingsYo" : "recordingsEn";
  const pattern = new RegExp(`export const ${name}: Readonly<Record<string, string>> = \\{[\\s\\S]*?\\};`);
  if (!pattern.test(source)) {
    console.error(`Could not find ${name} in ${mapFile}`);
    process.exit(1);
  }
  const body = entries.length ? `{\n${entries.join("\n")}\n}` : "{}";
  writeFileSync(mapFile, source.replace(pattern, `export const ${name}: Readonly<Record<string, string>> = ${body};`), "utf8");
  console.log(`Registered ${entries.length} recording(s) in content/${lang}/audio-map.ts at the current wording.`);
}
