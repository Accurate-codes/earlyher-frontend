import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { triageText } from "@/content/en/triage";
import { QUESTION_IDS, questionShape } from "@/lib/triage/questions";
import { availabilityOf, planSegments, type Support } from "./audio-controller";
import { allSpeechIds, speechText, textVersion } from "./speech-catalog";

const noRecordings = { en: {}, yo: {} };
const nothing: Support = { generated: {}, generatedCheck: "done", deviceLanguages: [] };
const question = (id: string) => [`triage.questions.${id}.prompt`, ...questionShape(id as never).options.map((o) => `triage.questions.${id}.options.${o}`)];

describe("speech catalogue", () => {
  it("reads the selected language for the same content id", () => {
    const en = speechText("en", "triage.questions.R1.prompt");
    const yo = speechText("yo", "triage.questions.R1.prompt");
    expect(en?.text).toBe(triageText.questions.R1.prompt);
    expect(yo?.text).toMatch(/ibà/);
    expect(yo?.version).not.toBe(en?.version);
  });

  it("has every question, answer and result in both languages", () => {
    for (const locale of ["en", "yo"] as const) {
      for (const id of QUESTION_IDS) for (const contentId of question(id)) expect(speechText(locale, contentId), contentId).not.toBeNull();
      for (const outcome of ["red", "orange", "yellow", "green", "review"]) {
        expect(speechText(locale, `triage.results.outcomes.${outcome}.body`)).not.toBeNull();
      }
    }
  });

  it("only offers fixed wording, never functions, unknown or malformed ids", () => {
    expect(speechText("yo", "triage.results.moreReasons")).toBeNull();
    expect(speechText("yo", "triage.questions.ZZ.prompt")).toBeNull();
    expect(speechText("yo", "../../etc/passwd")).toBeNull();
    expect(speechText("yo", "triage.questions.R1.__proto__")).toBeNull();
    expect(speechText("yo", "ui.dev.title")).not.toBeNull();
    expect(allSpeechIds("yo")).not.toContain("ui.dev.title");
    expect(allSpeechIds("yo").length).toBeGreaterThan(400);
  });

  it("changes the version whenever the wording changes", () => {
    expect(textVersion("Ẹ kú àbọ̀")).toBe(textVersion("Ẹ kú àbọ̀".normalize("NFD")));
    expect(textVersion("Ẹ kú àbọ̀")).not.toBe(textVersion("Ẹ kú abọ̀"));
    expect(textVersion("x")).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("choosing an audio source", () => {
  const ids = question("R1");

  it("says Yoruba audio is unavailable when there is no recording, provider or Yoruba voice", () => {
    expect(availabilityOf("yo", ids, nothing, noRecordings)).toBe("unavailable");
  });

  it("never uses an English device voice for Yoruba", () => {
    expect(availabilityOf("yo", ids, { ...nothing, deviceLanguages: ["en"] }, noRecordings)).toBe("unavailable");
    expect(availabilityOf("en", ids, { ...nothing, deviceLanguages: ["en"] }, noRecordings)).toBe("ready");
  });

  it("uses an actual Yoruba device voice when one exists", () => {
    expect(availabilityOf("yo", ids, { ...nothing, deviceLanguages: ["en", "yo"] }, noRecordings)).toBe("ready");
  });

  it("waits for the server before deciding", () => {
    expect(availabilityOf("yo", ids, { generated: null, generatedCheck: "pending", deviceLanguages: [] }, noRecordings)).toBe("checking");
  });

  it("uses generated speech when the server has a Yoruba provider", () => {
    const support: Support = { ...nothing, generated: { yo: { provider: "Spitch", voice: "sade" } } };
    expect(availabilityOf("yo", ids, support, noRecordings)).toBe("ready");
    expect(planSegments("yo", ids, support, noRecordings)?.[0].sources).toEqual(["generated"]);
  });

  it("prefers a recording made for the current wording, and ignores an outdated one", () => {
    const current = speechText("yo", "triage.questions.R1.prompt")!.version;
    const recorded = { en: {}, yo: Object.fromEntries(ids.map((id) => [id, speechText("yo", id)!.version])) };
    expect(availabilityOf("yo", ids, nothing, recorded)).toBe("ready");
    const stale = { en: {}, yo: { ...recorded.yo, "triage.questions.R1.prompt": current === "00000000" ? "11111111" : "00000000" } };
    expect(availabilityOf("yo", ids, nothing, stale)).toBe("unavailable");
    const withProvider: Support = { ...nothing, generated: { yo: { provider: "Spitch", voice: "sade" } } };
    expect(planSegments("yo", ids, withProvider, recorded)?.[0].sources).toEqual(["recording", "generated"]);
  });

  it("does not play part of a screen: one unreadable id makes the control unavailable", () => {
    expect(availabilityOf("en", [...ids, "triage.questions.ZZ.prompt"], { ...nothing, deviceLanguages: ["en"] }, noRecordings)).toBe("unavailable");
  });
});

describe("speech endpoint", () => {
  const original = { ...process.env };
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.SPEECH_CACHE_DIR = "off";
    delete process.env.SPEECH_PROVIDER;
    delete process.env.SPITCH_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...original };
  });

  const route = () => import("@/app/api/speech/route");
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    new Request("http://localhost:3000/api/speech", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  const valid = () => ({ lang: "yo", id: "triage.questions.R1.prompt", version: speechText("yo", "triage.questions.R1.prompt")!.version });

  it("reports no generated speech when no provider is configured", async () => {
    const { GET, POST } = await route();
    expect(await (await GET()).json()).toEqual({ languages: {} });
    const response = await POST(post(valid()));
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates requests", async () => {
    process.env.SPEECH_PROVIDER = "spitch";
    process.env.SPITCH_API_KEY = "test-key";
    const { POST } = await route();
    expect((await POST(post({ ...valid(), lang: "fr" }))).status).toBe(400);
    expect((await POST(post({ ...valid(), version: "zz" }))).status).toBe(400);
    expect((await POST(post({ ...valid(), id: "triage.questions.ZZ.prompt" }))).status).toBe(404);
    expect((await POST(post({ ...valid(), version: "00000000" }))).status).toBe(409);
    expect((await POST(post("not json"))).status).toBe(400);
    expect((await POST(post(valid(), { origin: "https://elsewhere.example" }))).status).toBe(403);
    expect((await POST(post(valid(), { "content-type": "text/plain" }))).status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends only the fixed wording to Spitch, keeps the key on the server and reuses the clip", async () => {
    process.env.SPEECH_PROVIDER = "spitch";
    process.env.SPITCH_API_KEY = "test-key";
    fetchMock.mockResolvedValue(new Response(new Uint8Array(200), { status: 200, headers: { "content-type": "audio/wav" } }));
    const { GET, POST } = await route();
    expect(await (await GET()).json()).toEqual({ languages: { yo: { provider: "Spitch", voice: "sade" } } });

    const first = await POST(post(valid()));
    expect(first.status).toBe(200);
    expect(first.headers.get("content-type")).toBe("audio/mpeg");
    expect(first.headers.get("cache-control")).toContain("no-store");
    expect((await first.arrayBuffer()).byteLength).toBe(200);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.spitch.app/v1/speech");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject({ language: "yo", voice: "sade", format: "mp3", text: speechText("yo", "triage.questions.R1.prompt")!.text.normalize("NFC") });

    const second = await POST(post(valid()));
    expect(second.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports provider failures without detail", async () => {
    process.env.SPEECH_PROVIDER = "spitch";
    process.env.SPITCH_API_KEY = "test-key";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("echo of the text", { status: 500 }));
    const { POST } = await route();
    const response = await POST(post(valid()));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("echo");
  });

  it("limits how many new clips one client can generate", async () => {
    process.env.SPEECH_PROVIDER = "spitch";
    process.env.SPITCH_API_KEY = "test-key";
    process.env.SPEECH_GENERATIONS_PER_MINUTE = "2";
    fetchMock.mockImplementation(async () => new Response(new Uint8Array(100), { status: 200 }));
    const { POST } = await route();
    const ids = ["triage.questions.R1.prompt", "triage.questions.R2.prompt", "triage.questions.R3.prompt"];
    const statuses = [];
    for (const id of ids) statuses.push((await POST(post({ lang: "yo", id, version: speechText("yo", id)!.version }))).status);
    expect(statuses).toEqual([200, 200, 429]);
  });
});
