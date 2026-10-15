import { appConfig } from "@/lib/config";
import { createMockExplanationService, httpExplanationService } from "./ai-explanation";
import { createMockFacilityService, httpFacilityService } from "./facilities";
import { mockScenarios } from "./mock-scenarios";
import { createMockSmsService, httpSmsService } from "./sms";

/**
 * The adapters the interface uses. Set NEXT_PUBLIC_API_MODE=http and
 * NEXT_PUBLIC_API_BASE_URL to switch every adapter to the Python backend.
 */
const live = appConfig.apiMode === "http";

export const isMockMode = !live;
export const explanationService = live ? httpExplanationService : createMockExplanationService();
export const facilityService = live ? httpFacilityService : createMockFacilityService();
export const smsService = live ? httpSmsService : createMockSmsService();

export type PrinterStatus = "unknown" | "unavailable";

/**
 * A browser cannot see the printer. "unknown" is the truthful default; a kiosk
 * device agent could report "unavailable" here once hardware integration exists.
 */
export function getPrinterStatus(): PrinterStatus {
  return live ? "unknown" : mockScenarios.get().printer;
}
