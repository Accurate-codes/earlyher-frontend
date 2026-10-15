/**
 * Runtime configuration. Only NEXT_PUBLIC_* values are read here, so nothing in this
 * file may ever hold a secret: API keys for AI or SMS belong on the Python backend.
 */

function seconds(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : fallback * 1000;
}

export type ApiMode = "mock" | "http";

export const appConfig = {
  /** "mock" runs without any backend. "http" calls the Python service at apiBaseUrl. */
  apiMode: (process.env.NEXT_PUBLIC_API_MODE === "http" ? "http" : "mock") as ApiMode,
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, ""),

  /** Idle time before the "Are you still there?" warning appears. */
  inactivityTimeoutMs: seconds(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT_SECONDS, 120),
  /** Time the warning stays up before the session is cleared. */
  inactivityWarningMs: seconds(process.env.NEXT_PUBLIC_INACTIVITY_WARNING_SECONDS, 30),

  /** Longest voice note a person can record. */
  maxRecordingMs: seconds(process.env.NEXT_PUBLIC_MAX_RECORDING_SECONDS, 30),

  timeouts: {
    aiExplanationMs: 8000,
    facilitiesMs: 10000,
    smsMs: 12000,
  },

  /** Public page a printed QR code may link to. Left empty until a real page exists. */
  publicInfoUrl: process.env.NEXT_PUBLIC_PUBLIC_INFO_URL ?? "",

  /** "page" for ordinary printers, "thermal-80" for an 80mm receipt printer. */
  printLayout: (process.env.NEXT_PUBLIC_PRINT_LAYOUT === "thermal-80" ? "thermal-80" : "page") as
    | "page"
    | "thermal-80",

  /**
   * Shows interface-test fixtures and the demo-state switcher. On by default in
   * `next dev`, off in production builds unless explicitly enabled.
   */
  showDevFixtures:
    process.env.NEXT_PUBLIC_SHOW_DEV_FIXTURES === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SHOW_DEV_FIXTURES !== "false"),

  defaultLocale: "en" as const,
};
