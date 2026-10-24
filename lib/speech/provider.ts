import type { Locale } from "@/lib/types/locale";

/**
 * Server-side text-to-speech. Runs only in the /api/speech route; API keys are read from
 * server environment variables and never reach the browser.
 *
 * Only providers whose official documentation lists the language may be enabled for it.
 * Spitch documents Yoruba ("language": "yo") with the system voices Sade, Funmi (feminine),
 * Segun and Femi (masculine): https://docs.spitch.app/features/speech and
 * https://docs.spitch.app/concepts/voices (checked 2026-10-23).
 */

export interface SpeechAudio {
  audio: Uint8Array;
  contentType: string;
}

export interface SpeechProvider {
  /** Shown to the person in the AI-voice disclosure. */
  name: string;
  /** Voice used for a language, or null if this provider is not set up for it. */
  voiceFor(locale: Locale): string | null;
  synthesize(text: string, locale: Locale, voice: string, signal: AbortSignal): Promise<SpeechAudio>;
}

export class SpeechProviderError extends Error {
  constructor(
    message: string,
    /** "config": wrong key or voice; "busy": provider rate limit; "failed": anything else. */
    readonly kind: "config" | "busy" | "failed",
  ) {
    super(message);
  }
}

const SPITCH_LANGUAGES: Partial<Record<Locale, string>> = { yo: "yo", en: "en" };
const SPITCH_DEFAULT_VOICES: Partial<Record<Locale, string>> = { yo: "sade" };

function spitch(apiKey: string, voices: Partial<Record<Locale, string>>): SpeechProvider {
  return {
    name: "Spitch",
    voiceFor: (locale) => (SPITCH_LANGUAGES[locale] ? (voices[locale] ?? null) : null),
    async synthesize(text, locale, voice, signal) {
      const response = await fetch("https://api.spitch.app/v1/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: SPITCH_LANGUAGES[locale], voice, format: "mp3", speed: 0.95 }),
        signal,
        cache: "no-store",
      });
      if (!response.ok) {
        // The body is not logged or returned: it could echo the text.
        const kind = response.status === 401 || response.status === 403 || response.status === 422 ? "config" : response.status === 429 ? "busy" : "failed";
        throw new SpeechProviderError(`Spitch returned ${response.status}`, kind);
      }
      const audio = new Uint8Array(await response.arrayBuffer());
      if (audio.byteLength < 64) throw new SpeechProviderError("Spitch returned no audio", "failed");
      return { audio, contentType: "audio/mpeg" };
    },
  };
}

function voiceSetting(value: string | undefined): string | undefined {
  const voice = value?.trim().toLowerCase();
  return voice && /^[a-z0-9_-]{1,64}$/.test(voice) ? voice : undefined;
}

/**
 * The configured provider, or null. Languages are enabled explicitly with
 * SPEECH_LANGUAGES (default "yo"); English keeps using recordings and the device voice.
 */
export function configuredProvider(env: NodeJS.ProcessEnv = process.env): SpeechProvider | null {
  const name = env.SPEECH_PROVIDER?.trim().toLowerCase();
  const languages = (env.SPEECH_LANGUAGES ?? "yo").split(",").map((code) => code.trim());
  const enabled = (locale: Locale) => languages.includes(locale);

  if (name === "spitch") {
    const key = env.SPITCH_API_KEY?.trim();
    if (!key) return null;
    const voices: Partial<Record<Locale, string>> = {};
    if (enabled("yo")) voices.yo = voiceSetting(env.SPITCH_VOICE_YO) ?? SPITCH_DEFAULT_VOICES.yo;
    if (enabled("en")) voices.en = voiceSetting(env.SPITCH_VOICE_EN);
    return spitch(key, voices);
  }
  return null;
}
