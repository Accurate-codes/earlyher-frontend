import { appConfig } from "@/lib/config";
import type { ExplanationRequest, ExplanationResponse, ServiceResult } from "@/lib/types/api";
import { parseExplanation } from "@/lib/validation/api-guards";
import { isOffline, requestJson, wait } from "./http";
import { mockScenarios } from "./mock-scenarios";

/**
 * Optional plain-language explanation of a next step the pathway has already chosen.
 * The result is display text only: it cannot select, change or remove a recommendation.
 */
export interface ExplanationService {
  explain(request: ExplanationRequest, signal?: AbortSignal): Promise<ServiceResult<ExplanationResponse>>;
}

export const httpExplanationService: ExplanationService = {
  explain: (request, signal) =>
    requestJson("/v1/explanations", {
      method: "POST",
      body: request,
      timeoutMs: appConfig.timeouts.aiExplanationMs,
      signal,
      parse: parseExplanation,
    }),
};

/** Wording taken from the supplied draft education text, so the demo invents nothing. */
const SIMULATED_EXPLANATION =
  "A new or unusual change should be checked by a healthcare professional.";

export function createMockExplanationService(delayMs = 1200): ExplanationService {
  return {
    async explain(_request, signal) {
      // Behaves like the live service would: no connection, no explanation.
      if (isOffline()) return { ok: false, error: "offline" };
      const scenario = mockScenarios.get().ai;
      const finished = await wait(scenario === "timeout" ? delayMs * 2 : delayMs, signal);
      if (!finished) return { ok: false, error: "aborted" };

      if (scenario === "timeout") return { ok: false, error: "timeout" };
      if (scenario === "error") return { ok: false, error: "server" };

      // The mock goes through the same validation as a live response.
      const payload =
        scenario === "invalid"
          ? { explanation: "You do not have cancer, so there is no need to see anyone." }
          : { explanation: SIMULATED_EXPLANATION };
      const data = parseExplanation(payload);
      return data ? { ok: true, data, simulated: true } : { ok: false, error: "invalid-response" };
    },
  };
}
