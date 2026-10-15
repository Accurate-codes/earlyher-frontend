import { appConfig } from "@/lib/config";
import type { ServiceResult, SmsRequest, SmsResponse } from "@/lib/types/api";
import { parseSmsResponse } from "@/lib/validation/api-guards";
import { isOffline, requestJson, wait } from "./http";
import { mockScenarios } from "./mock-scenarios";

/**
 * Hands an SMS request to the backend, which owns the provider and its credentials.
 * A request is sent once, while the person is present. Nothing is stored to retry later.
 */
export interface SmsService {
  send(request: SmsRequest, signal?: AbortSignal): Promise<ServiceResult<SmsResponse>>;
}

export const httpSmsService: SmsService = {
  send: (request, signal) =>
    requestJson("/v1/sms", {
      method: "POST",
      body: request,
      timeoutMs: appConfig.timeouts.smsMs,
      signal,
      parse: parseSmsResponse,
    }),
};

/** Sends nothing. Results are marked `simulated` so the interface can say so. */
export function createMockSmsService(delayMs = 1400): SmsService {
  return {
    async send(_request, signal) {
      if (isOffline()) return { ok: false, error: "offline" };
      if (!(await wait(delayMs, signal))) return { ok: false, error: "aborted" };
      const scenario = mockScenarios.get().sms;
      if (scenario === "failure") return { ok: false, error: "server" };
      return { ok: true, data: { status: scenario }, simulated: true };
    },
  };
}
