import type { FacilityRecord } from "@/lib/types/facility";

/**
 * Nigeria Health Facility Registry (HFR) adapter — SERVER ONLY, NOT YET CONNECTED.
 *
 * What was confirmed on 17 October 2026 from https://www.hfr.fmohconnect.gov.ng/developers:
 *   - REST base URL https://backend.hfr.fmohconnect.gov.ng/api/v1 (also FHIR R4 at /api/fhir)
 *   - read-only GET /facilities, JSON
 *   - an API key sent in the X-API-Key header, requested through a form on that page
 * Not documented publicly: filter parameters (state, LGA), pagination, response field
 * names, rate limits, export, and reuse terms. Those must be confirmed before this
 * adapter can map records, so `mapHfrRecord` deliberately refuses to guess.
 *
 * Never import this file from a client component: the key must stay on the server.
 * Configure with HFR_API_KEY (and optionally HFR_API_BASE_URL) in .env.local.
 * Registry inclusion does not prove accreditation, current services, hours or phone accuracy.
 */

const DEFAULT_BASE_URL = "https://backend.hfr.fmohconnect.gov.ng/api/v1";

export type HfrResult =
  | { status: "not-configured" }
  | { status: "mapping-not-verified"; sample: unknown }
  | { status: "error"; httpStatus?: number }
  | { status: "ok"; records: FacilityRecord[] };

export function hfrConfig() {
  const apiKey = process.env.HFR_API_KEY?.trim() ?? "";
  const baseUrl = (process.env.HFR_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { apiKey, baseUrl, configured: apiKey.length > 0 };
}

/**
 * Fetches one page of facilities so the response format can be inspected once a key
 * is issued. Query parameters are passed through unchanged because the supported
 * filters are not yet documented.
 */
export async function fetchHfrFacilities(params: Record<string, string> = {}, signal?: AbortSignal): Promise<HfrResult> {
  if (typeof window !== "undefined") throw new Error("The HFR adapter must only run on the server.");
  const { apiKey, baseUrl, configured } = hfrConfig();
  if (!configured) return { status: "not-configured" };

  const url = new URL(`${baseUrl}/facilities`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "X-API-Key": apiKey },
      cache: "no-store",
      signal,
    });
    if (!response.ok) return { status: "error", httpStatus: response.status };
    const payload: unknown = await response.json();
    const records = mapHfrPayload(payload);
    return records ? { status: "ok", records } : { status: "mapping-not-verified", sample: payload };
  } catch {
    return { status: "error" };
  }
}

/**
 * Converts an HFR response into internal records. Returns null until the real field
 * names have been confirmed against the API documentation or a live response.
 *
 * When implementing: keep the HFR code in `hfrCode`, set `source: "hfr"` on each field,
 * record `retrievedOn`, leave unknown fields null, and keep `verification` "unverified".
 * Join to GRID3 records by HFR code only; never by similar names alone.
 */
export function mapHfrPayload(payload: unknown): FacilityRecord[] | null {
  void payload;
  return null;
}
