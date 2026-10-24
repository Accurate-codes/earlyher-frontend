import { speechText } from "@/lib/audio/speech-catalog";
import { isLocale } from "@/lib/i18n/translate";
import { readCached, writeCached, type SpeechKey } from "@/lib/speech/cache";
import { configuredProvider, SpeechProviderError, type SpeechAudio } from "@/lib/speech/provider";
import { speechLimits } from "@/lib/speech/rate-limit";

/**
 * Speech for fixed app wording.
 *
 * GET  /api/speech  which languages have generated speech, and with which provider/voice.
 * POST /api/speech  { lang, id, version } → audio/mpeg
 *
 * The browser sends only a content id (for example "triage.questions.R1.prompt") and the
 * wording version. The text is looked up here from the app's own content, so this endpoint
 * cannot be used to speak arbitrary text and never receives a person's answers. Ids are
 * sent in the body rather than the URL so access logs do not record which result was read.
 * Nothing about the request is logged.
 */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const inFlight = new Map<string, Promise<SpeechAudio>>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "direct";
}

/** Only this app's own pages may call the endpoint from a browser. */
function sameOrigin(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function GET() {
  const provider = configuredProvider();
  const languages: Record<string, { provider: string; voice: string }> = {};
  for (const locale of ["en", "yo"] as const) {
    const voice = provider?.voiceFor(locale);
    if (provider && voice) languages[locale] = { provider: provider.name, voice };
  }
  return json({ languages });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "bad-request" }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > 512) return json({ error: "bad-request" }, 413);
  const client = clientKey(request);
  if (!speechLimits.requests.take(client)) return json({ error: "busy" }, 429);

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 512) return json({ error: "bad-request" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad-request" }, 400);
  }
  const { lang, id, version } = (body ?? {}) as Record<string, unknown>;
  if (!isLocale(lang) || typeof id !== "string" || id.length > 120 || typeof version !== "string" || !/^[0-9a-f]{8}$/.test(version)) {
    return json({ error: "bad-request" }, 400);
  }

  const entry = speechText(lang, id);
  if (!entry) return json({ error: "unknown-text" }, 404);
  // The page and the server disagree on the wording, for example during a deployment.
  if (entry.version !== version) return json({ error: "stale" }, 409);

  const provider = configuredProvider();
  const voice = provider?.voiceFor(lang);
  if (!provider || !voice) return json({ error: "unavailable" }, 503);

  const key: SpeechKey = { provider: provider.name, voice, locale: lang, id, version };
  const headers = {
    "Content-Type": "audio/mpeg",
    // Fixed wording, but kept out of shared caches: which clip was asked for can hint at a result.
    "Cache-Control": "private, no-store",
    "X-Speech-Provider": provider.name,
    "X-Speech-Voice": voice,
  };

  const cached = await readCached(key);
  if (cached) return new Response(cached.audio.slice().buffer, { headers });

  const flightKey = JSON.stringify(key);
  let pending = inFlight.get(flightKey);
  if (!pending) {
    if (!speechLimits.generations.take(client) || !speechLimits.daily.take("all")) return json({ error: "busy" }, 429);
    pending = provider
      .synthesize(entry.text.normalize("NFC"), lang, voice, AbortSignal.timeout(20_000))
      .then(async (clip) => {
        await writeCached(key, clip);
        return clip;
      })
      .finally(() => inFlight.delete(flightKey));
    inFlight.set(flightKey, pending);
  }

  try {
    const clip = await pending;
    return new Response(clip.audio.slice().buffer, { headers });
  } catch (error) {
    const kind = error instanceof SpeechProviderError ? error.kind : "failed";
    // Status only: no text, id or language is logged.
    console.warn(`[speech] provider request failed (${kind})`);
    return json({ error: kind === "busy" ? "busy" : "failed" }, kind === "busy" ? 429 : 502);
  }
}
