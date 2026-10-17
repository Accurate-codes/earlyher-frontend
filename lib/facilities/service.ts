import { appConfig } from "@/lib/config";
import { isOffline, wait } from "@/lib/services/http";
import { mockScenarios } from "@/lib/services/mock-scenarios";
import type { ServiceResult } from "@/lib/types/api";
import type { FacilityDataset } from "@/lib/types/facility";
import { parseSnapshot } from "./snapshot";

/**
 * Loads the facility snapshot. It is a public file served with the app, so the service
 * worker keeps a copy and the list keeps working offline once it has been downloaded.
 * Facility data is public and identical for everyone; nothing about the person is sent.
 */

export const SNAPSHOT_URL = "/data/facilities-lagos.json";

let cached: FacilityDataset | null = null;

export async function loadFacilities(signal?: AbortSignal): Promise<ServiceResult<FacilityDataset>> {
  // Reviewers can force each state from the demo panel in development builds.
  const scenario = appConfig.showDevFixtures ? mockScenarios.get().facilities : "snapshot";
  if (scenario !== "snapshot") {
    if (!(await wait(500, signal))) return { ok: false, error: "aborted" };
    if (scenario === "error") return { ok: false, error: "server" };
    if (scenario === "unavailable") return { ok: false, error: "unavailable" };
    if (scenario === "offline") return { ok: false, error: "offline" };
    // "empty": the real source details with no records, to review the empty state.
    const result: ServiceResult<FacilityDataset> = cached
      ? { ok: true, data: cached, simulated: false }
      : await fetchSnapshot(signal);
    return result.ok ? { ok: true, data: { ...result.data, records: [] }, simulated: true } : result;
  }

  if (cached) return { ok: true, data: cached, simulated: false };
  const result = await fetchSnapshot(signal);
  if (result.ok) cached = result.data;
  return result;
}

async function fetchSnapshot(signal?: AbortSignal): Promise<ServiceResult<FacilityDataset>> {
  if (signal?.aborted) return { ok: false, error: "aborted" };
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, appConfig.timeouts.facilitiesMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    // Offline, the service worker answers from its cache if it has a copy.
    const response = await fetch(SNAPSHOT_URL, { signal: controller.signal, credentials: "omit" });
    if (response.status === 404) return { ok: false, error: "unavailable" };
    if (!response.ok) return { ok: false, error: isOffline() ? "offline" : "server" };
    const data = parseSnapshot(await response.json().catch(() => null));
    return data ? { ok: true, data, simulated: false } : { ok: false, error: "invalid-response" };
  } catch {
    if (signal?.aborted) return { ok: false, error: "aborted" };
    if (timedOut) return { ok: false, error: "timeout" };
    return { ok: false, error: isOffline() ? "offline" : "unavailable" };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
