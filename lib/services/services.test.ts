import { afterEach, describe, expect, it, vi } from "vitest";
import { parseExplanation, parseFacility, parseSmsResponse } from "@/lib/validation/api-guards";
import { checkPhoneNumber, formatPhoneDigits, sanitiseDigits } from "@/lib/validation/phone";
import { createMockExplanationService } from "./ai-explanation";
import { requestJson } from "./http";
import { mockScenarios } from "./mock-scenarios";
import { createMockSmsService } from "./sms";

const request = {
  recommendationId: "speak-to-professional",
  pathwayId: "lump-or-swelling",
  pathwayVersion: "0.1.0-demo",
  questionBankVersion: "0.1.0-demo",
  locale: "en",
};

afterEach(() => {
  mockScenarios.reset();
  vi.unstubAllGlobals();
});

describe("AI explanation fallback", () => {
  const service = createMockExplanationService(1);

  it("returns a simulated explanation that is marked as simulated", async () => {
    const result = await service.explain(request);
    expect(result).toMatchObject({ ok: true, simulated: true });
  });

  it.each([
    ["timeout", "timeout"],
    ["error", "server"],
    ["invalid", "invalid-response"],
  ] as const)("reports %s as a failure instead of throwing", async (scenario, error) => {
    mockScenarios.set({ ai: scenario });
    await expect(service.explain(request)).resolves.toEqual({ ok: false, error });
  });

  it("stops when the session is reset", async () => {
    const controller = new AbortController();
    const pending = createMockExplanationService(5000).explain(request, controller.signal);
    controller.abort();
    await expect(pending).resolves.toEqual({ ok: false, error: "aborted" });
  });

  it("rejects explanations that diagnose, score risk, prescribe or discourage care", () => {
    for (const explanation of [
      "You do not have cancer.",
      "You probably have breast cancer.",
      "This lump is benign.",
      "Your diagnosis is a cyst.",
      "You are low-risk.",
      "Take 500mg of paracetamol.",
      "There is no need to see a doctor.",
      "<b>Hello</b>",
      "x".repeat(2000),
    ]) {
      expect(parseExplanation({ explanation }), explanation).toBeNull();
    }
  });

  it("rejects payloads of the wrong shape", () => {
    for (const payload of [null, "text", [], {}, { explanation: 3 }, { explanation: "   " }]) {
      expect(parseExplanation(payload)).toBeNull();
    }
  });

  it("accepts plain supportive wording", () => {
    const explanation = "A change doesn't always mean cancer. A healthcare professional can examine you.";
    expect(parseExplanation({ explanation })).toEqual({ explanation });
  });
});

describe("backend facility guard", () => {
  it("drops a phone number from a facility the backend has not verified", () => {
    const base = { id: "f1", name: "Name", type: "Type", areaId: "a1", address: "Address", phone: "08030000000" };
    expect(parseFacility({ ...base, verification: { status: "unverified" } })?.phone).toBeUndefined();
    expect(parseFacility({ ...base, verification: { status: "verified" } })?.phone).toBe("08030000000");
    expect(parseFacility({ ...base })).toBeNull();
  });
});

describe("SMS", () => {
  const sms = { phoneNumber: "+2348031234567", templateId: "next-step", locale: "en" } as const;

  it("marks mock results as simulated and never reports delivery", async () => {
    const result = await createMockSmsService(1).send(sms);
    expect(result).toEqual({ ok: true, data: { status: "accepted" }, simulated: true });
    expect(parseSmsResponse({ status: "delivered" })).toBeNull();
    expect(parseSmsResponse({ status: "sent" })).toBeNull();
  });

  it("reports failure", async () => {
    mockScenarios.set({ sms: "failure" });
    await expect(createMockSmsService(1).send(sms)).resolves.toEqual({ ok: false, error: "server" });
  });

  it("does not send or queue when offline", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    await expect(createMockSmsService(1).send(sms)).resolves.toEqual({ ok: false, error: "offline" });
  });
});

describe("HTTP adapter safety", () => {
  it("does not call the network when offline", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("navigator", { onLine: false });

    const result = await requestJson("/v1/sms", { timeoutMs: 50, parse: parseSmsResponse });

    expect(result).toEqual({ ok: false, error: "offline" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports unavailable when no backend address is configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(requestJson("/v1/areas", { timeoutMs: 50, parse: () => null })).resolves.toEqual({
      ok: false,
      error: "unavailable",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("phone number validation", () => {
  it("accepts Nigerian mobile numbers and converts them to international format", () => {
    expect(checkPhoneNumber("08031234567")).toEqual({ valid: true, e164: "+2348031234567" });
    expect(checkPhoneNumber("09161234567")).toEqual({ valid: true, e164: "+2349161234567" });
  });

  it("explains what is wrong with other input", () => {
    expect(checkPhoneNumber("")).toEqual({ valid: false, reason: "empty" });
    expect(checkPhoneNumber("8031234567")).toEqual({ valid: false, reason: "must-start-with-0" });
    expect(checkPhoneNumber("0803123")).toEqual({ valid: false, reason: "too-short" });
    expect(checkPhoneNumber("01234567890")).toEqual({ valid: false, reason: "not-a-mobile-number" });
  });

  it("keeps digits only and formats them for reading", () => {
    expect(sanitiseDigits("0803 123-4567 ext 9")).toBe("08031234567");
    expect(formatPhoneDigits("08031234567")).toBe("0803 123 4567");
    expect(formatPhoneDigits("0803")).toBe("0803");
  });
});
