import { recordingsEn } from "@/content/en/audio-map";
import { recordingsYo } from "@/content/yo/audio-map";
import { localeStore } from "@/lib/i18n/locale-store";
import type { Locale } from "@/lib/types/locale";
import { speechText } from "./speech-catalog";

/**
 * One playback at a time for the whole app.
 *
 * Each Listen control reads a list of content ids (see speech-catalog.ts) in the selected
 * language. For each piece of text, in order of preference:
 *   1. a reviewed recording made for the current wording (content/<lang>/audio-map.ts);
 *   2. generated speech from the server (/api/speech), when a provider that supports the
 *      language is configured; it is labelled as AI-generated while it plays;
 *   3. a voice on this device that actually speaks the language. Setting lang="yo-NG" does
 *      not create a Yoruba voice, so Yoruba is only spoken by a voice whose own language is
 *      Yoruba; an English voice is never used for Yoruba text.
 * If any piece has none of these, the control says audio is unavailable instead of playing
 * part of the screen or the wrong language.
 *
 * Playback stops when the screen, question or language changes, and when the session ends.
 */

export type Source = "recording" | "generated" | "device";
export type AudioError = "network" | "busy" | "failed" | "unavailable";

export interface AudioState {
  /** The Listen control this state belongs to. */
  controlId: string | null;
  status: "idle" | "loading" | "playing" | "paused" | "error";
  /** Pause is offered only for recordings and generated speech; device voices cannot pause reliably. */
  canPause: boolean;
  /** Some of what is playing is AI-generated speech. */
  generated: boolean;
  /** Some of what is playing uses the device's own voice. */
  device: boolean;
  error: AudioError | null;
}

interface GeneratedVoice {
  provider: string;
  voice: string;
}

export interface Support {
  /** Generated speech per language; null until the server has been asked. */
  generated: Partial<Record<Locale, GeneratedVoice>> | null;
  generatedCheck: "pending" | "done" | "failed";
  /** Languages this device has an actual voice for. */
  deviceLanguages: Locale[];
}

export type Availability = "ready" | "checking" | "unavailable";

export interface Segment {
  id: string;
  text: string;
  version: string;
  sources: Source[];
}

type Recordings = Record<Locale, Readonly<Record<string, string>>>;

const RECORDINGS: Recordings = { en: recordingsEn, yo: recordingsYo };

const idle: AudioState = { controlId: null, status: "idle", canPause: false, generated: false, device: false, error: null };
const initialSupport: Support = { generated: null, generatedCheck: "pending", deviceLanguages: [] };

let state: AudioState = idle;
let support: Support = initialSupport;
const listeners = new Set<() => void>();

let token = 0;
let element: HTMLAudioElement | null = null;
let aborter: AbortController | null = null;
/** Generated clips already fetched this session, as object URLs. Cleared when the session ends. */
const clips = new Map<string, string>();
const MAX_CLIPS = 300;

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: AudioState) {
  state = next;
  emit();
}

function setSupport(next: Partial<Support>) {
  support = { ...support, ...next };
  emit();
}

// ---- What this device and server can do -------------------------------------------

function deviceVoiceFor(locale: Locale): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang.toLowerCase().replace("_", "-").split("-")[0] === locale) ?? null;
}

function refreshVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const languages = (["en", "yo"] as const).filter((locale) => deviceVoiceFor(locale));
  // Some browsers list no voices until speech is used, while English still plays with the default voice.
  if (!languages.includes("en") && "SpeechSynthesisUtterance" in window) languages.unshift("en");
  if (languages.join() !== support.deviceLanguages.join()) setSupport({ deviceLanguages: languages });
}

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  refreshVoices();
  if ("speechSynthesis" in window) window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
  // Changing language stops whatever is playing.
  localeStore.subscribe(() => audioController.stop());
  void checkGenerated();
}

async function checkGenerated() {
  try {
    const response = await fetch("/api/speech", { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    const body = (await response.json()) as { languages?: Partial<Record<Locale, GeneratedVoice>> };
    setSupport({ generated: body.languages ?? {}, generatedCheck: "done" });
  } catch {
    // Offline or no server route (for example a static export): generated speech is unavailable.
    setSupport({ generated: {}, generatedCheck: "failed" });
  }
}

/** Where each piece of text can come from, in order of preference; null if an id has no text. */
export function planSegments(locale: Locale, ids: string[], available: Support, recordings: Recordings = RECORDINGS): Segment[] | null {
  const segments: Segment[] = [];
  for (const id of ids) {
    const entry = speechText(locale, id);
    if (!entry) return null;
    const sources: Source[] = [];
    // A recording is used only if it was made for the current wording.
    if (recordings[locale][id] === entry.version) sources.push("recording");
    if (available.generated?.[locale]) sources.push("generated");
    if (available.deviceLanguages.includes(locale)) sources.push("device");
    segments.push({ id, text: entry.text, version: entry.version, sources });
  }
  return segments;
}

export function availabilityOf(locale: Locale, ids: string[], available: Support, recordings: Recordings = RECORDINGS): Availability {
  const segments = planSegments(locale, ids, available, recordings);
  if (!segments || segments.length === 0) return "unavailable";
  if (segments.every((segment) => segment.sources.length > 0)) return "ready";
  return available.generatedCheck === "pending" ? "checking" : "unavailable";
}

const plan = (locale: Locale, ids: string[]) => planSegments(locale, ids, support);

export function availability(locale: Locale, ids: string[]): Availability {
  return availabilityOf(locale, ids, support);
}

// ---- Playback ----------------------------------------------------------------------

function silence() {
  token += 1;
  aborter?.abort();
  aborter = null;
  if (element) {
    element.onended = null;
    element.onerror = null;
    element.pause();
    element.removeAttribute("src");
    element = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

class PlaybackError extends Error {
  constructor(readonly kind: AudioError) {
    super(kind);
  }
}

async function fetchGenerated(locale: Locale, segment: Segment, signal: AbortSignal): Promise<string> {
  const voice = support.generated?.[locale]?.voice ?? "";
  const key = [locale, voice, segment.id, segment.version].join("|");
  const cached = clips.get(key);
  if (cached) return cached;
  let response: Response;
  try {
    response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: locale, id: segment.id, version: segment.version }),
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new PlaybackError("network");
  }
  if (response.status === 429) throw new PlaybackError("busy");
  if (response.status === 503) {
    setSupport({ generated: { ...support.generated, [locale]: undefined } });
    throw new PlaybackError("unavailable");
  }
  if (!response.ok || !response.headers.get("content-type")?.startsWith("audio/")) throw new PlaybackError("failed");
  const url = URL.createObjectURL(await response.blob());
  if (clips.size >= MAX_CLIPS) {
    const [oldest] = clips;
    URL.revokeObjectURL(oldest[1]);
    clips.delete(oldest[0]);
  }
  clips.set(key, url);
  return url;
}

function playFile(src: string, mine: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    element = audio;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new PlaybackError("failed"));
    audio
      .play()
      .then(() => {
        if (mine === token) setState({ ...state, status: "playing" });
      })
      .catch(() => reject(new PlaybackError("failed")));
  });
}

function speakWithDevice(locale: Locale, text: string, mine: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const voice = deviceVoiceFor(locale);
    if (!voice && locale !== "en") return reject(new PlaybackError("unavailable"));
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-NG";
    utterance.rate = 0.92;
    utterance.onstart = () => {
      if (mine === token) setState({ ...state, status: "playing" });
    };
    utterance.onend = () => resolve();
    utterance.onerror = (event) => (event.error === "interrupted" || event.error === "canceled" ? resolve() : reject(new PlaybackError("failed")));
    window.speechSynthesis.speak(utterance);
  });
}

async function run(controlId: string, locale: Locale, segments: Segment[], mine: number, signal: AbortSignal) {
  const alive = () => mine === token;
  // Start fetching generated clips that will be needed, so pieces play without gaps.
  const pending = new Map<string, Promise<string>>();
  for (const segment of segments) {
    if (segment.sources[0] === "generated") {
      const request = fetchGenerated(locale, segment, signal);
      request.catch(() => undefined);
      pending.set(segment.id, request);
    }
  }

  for (const segment of segments) {
    let lastError: unknown = null;
    for (const source of segment.sources) {
      if (!alive()) return;
      try {
        const usesElement = source !== "device";
        setState({
          ...state,
          canPause: usesElement,
          generated: state.generated || source === "generated",
          device: state.device || source === "device",
        });
        if (source === "recording") await playFile(`/audio/${locale}/${segment.id}.mp3`, mine);
        else if (source === "generated") await playFile(await (pending.get(segment.id) ?? fetchGenerated(locale, segment, signal)), mine);
        else await speakWithDevice(locale, segment.text, mine);
        lastError = null;
        break;
      } catch (error) {
        if (!alive()) return;
        // A recording that fails to load (for example, offline and not cached) falls through to the next source.
        lastError = error;
      }
    }
    if (lastError) {
      if (!alive()) return;
      silence();
      setState({ ...idle, controlId, status: "error", error: lastError instanceof PlaybackError ? lastError.kind : "failed" });
      return;
    }
  }
  if (alive()) {
    element = null;
    setState(idle);
  }
}

export const audioController = {
  getState: (): AudioState => state,
  getServerState: (): AudioState => idle,
  getSupport: (): Support => support,
  getServerSupport: (): Support => initialSupport,

  /** Subscribing (from a mounted component) also starts checking voices and the server. */
  subscribe(listener: () => void) {
    start();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  play(controlId: string, locale: Locale, ids: string[]) {
    silence();
    const mine = token;
    const segments = plan(locale, ids);
    if (!segments || !segments.every((segment) => segment.sources.length > 0)) {
      setState({ ...idle, controlId, status: "error", error: "unavailable" });
      return;
    }
    aborter = new AbortController();
    setState({ ...idle, controlId, status: "loading" });
    void run(controlId, locale, segments, mine, aborter.signal);
  },

  pause() {
    if (state.status !== "playing" || !element) return;
    element.pause();
    setState({ ...state, status: "paused" });
  },

  resume() {
    if (state.status !== "paused" || !element) return;
    const audio = element;
    audio.play().then(
      () => setState({ ...state, status: "playing" }),
      () => audio.onerror?.(new Event("error")),
    );
  },

  /** Stops any playback and cancels pending requests. Called on navigation, language change and Finish. */
  stop() {
    silence();
    if (state !== idle) setState(idle);
  },

  /** Stops only if this control is the one playing; used when a control leaves the screen. */
  release(controlId: string) {
    if (state.controlId === controlId) this.stop();
  },

  /** Ends the session: stops playback and forgets fetched clips. */
  reset() {
    this.stop();
    for (const url of clips.values()) URL.revokeObjectURL(url);
    clips.clear();
  },
};
