import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SpeechAudio } from "./provider";

/**
 * Generated speech is fixed public wording, so each clip is made once and reused. The key
 * holds provider, voice, language, content id and wording version: editing a translation
 * or changing the voice produces a new key, and the old clip is simply never read again.
 *
 * Clips are kept in memory (bounded) and, when SPEECH_CACHE_DIR is writable, on disk so
 * they survive restarts. Delete that folder to regenerate everything.
 */

export interface SpeechKey {
  provider: string;
  voice: string;
  locale: string;
  id: string;
  version: string;
}

const MEMORY_LIMIT_BYTES = 40 * 1024 * 1024;
const memory = new Map<string, SpeechAudio>();
let memoryBytes = 0;

const safe = (part: string) => part.toLowerCase().replace(/[^a-z0-9._-]/g, "_");

export function cacheKey(key: SpeechKey): string {
  return [safe(key.provider), safe(key.voice), safe(key.locale), `${safe(key.id)}.${safe(key.version)}.mp3`].join("/");
}

function remember(key: string, clip: SpeechAudio) {
  if (memory.has(key)) return;
  memory.set(key, clip);
  memoryBytes += clip.audio.byteLength;
  // Oldest first: Map keeps insertion order.
  for (const [oldKey, oldClip] of memory) {
    if (memoryBytes <= MEMORY_LIMIT_BYTES) break;
    memory.delete(oldKey);
    memoryBytes -= oldClip.audio.byteLength;
  }
}

function cacheDir(): string | null {
  const dir = process.env.SPEECH_CACHE_DIR?.trim() || ".speech-cache";
  return dir === "off" ? null : path.resolve(dir);
}

export async function readCached(key: SpeechKey): Promise<SpeechAudio | null> {
  const name = cacheKey(key);
  const hit = memory.get(name);
  if (hit) {
    // Refresh its place so frequently played clips stay.
    memory.delete(name);
    memory.set(name, hit);
    return hit;
  }
  const dir = cacheDir();
  if (!dir) return null;
  try {
    const audio = new Uint8Array(await readFile(path.join(dir, name)));
    const clip = { audio, contentType: "audio/mpeg" };
    remember(name, clip);
    return clip;
  } catch {
    return null;
  }
}

export async function writeCached(key: SpeechKey, clip: SpeechAudio): Promise<void> {
  const name = cacheKey(key);
  remember(name, clip);
  const dir = cacheDir();
  if (!dir) return;
  try {
    const file = path.join(dir, name);
    await mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.${process.pid}.tmp`;
    await writeFile(temp, clip.audio);
    await rename(temp, file);
  } catch {
    // A read-only disk only means clips are kept in memory.
  }
}
