import { appConfig } from "@/lib/config";
import { fixtureAreas, fixtureFacilities } from "@/content/fixtures/facilities.fixture";
import type { Area, Facility, ServiceResult } from "@/lib/types/api";
import { parseAreas, parseFacilities, parseFacility } from "@/lib/validation/api-guards";
import { isOffline, requestJson, wait } from "./http";
import { mockScenarios } from "./mock-scenarios";

/** Facility lookup. The frontend never supplies facility data of its own. */
export interface FacilityService {
  listAreas(signal?: AbortSignal): Promise<ServiceResult<Area[]>>;
  listFacilities(areaId: string, signal?: AbortSignal): Promise<ServiceResult<Facility[]>>;
  getFacility(id: string, signal?: AbortSignal): Promise<ServiceResult<Facility>>;
}

const timeoutMs = appConfig.timeouts.facilitiesMs;

export const httpFacilityService: FacilityService = {
  listAreas: (signal) => requestJson("/v1/areas", { timeoutMs, signal, parse: parseAreas }),
  listFacilities: (areaId, signal) =>
    requestJson(`/v1/facilities?area_id=${encodeURIComponent(areaId)}`, { timeoutMs, signal, parse: parseFacilities }),
  getFacility: (id, signal) =>
    requestJson(`/v1/facilities/${encodeURIComponent(id)}`, { timeoutMs, signal, parse: parseFacility }),
};

/**
 * Without a verified data source the mock reports "unavailable". The fictional
 * fixtures are only reachable when a reviewer switches the demo state on.
 */
export function createMockFacilityService(delayMs = 700): FacilityService {
  async function run<T>(signal: AbortSignal | undefined, fixtures: () => T | null): Promise<ServiceResult<T>> {
    // Facility data would come from the backend, so the mock needs a connection too.
    if (isOffline()) return { ok: false, error: "offline" };
    if (!(await wait(delayMs, signal))) return { ok: false, error: "aborted" };
    const scenario = mockScenarios.get().facilities;
    if (scenario === "error") return { ok: false, error: "server" };
    if (scenario === "unavailable") return { ok: false, error: "unavailable" };
    const data = fixtures();
    return data === null ? { ok: false, error: "unavailable" } : { ok: true, data, simulated: true };
  }

  return {
    listAreas: (signal) => run(signal, () => fixtureAreas),
    listFacilities: (areaId, signal) =>
      run(signal, () =>
        mockScenarios.get().facilities === "empty" ? [] : fixtureFacilities.filter((f) => f.areaId === areaId),
      ),
    getFacility: (id, signal) => run(signal, () => fixtureFacilities.find((f) => f.id === id) ?? null),
  };
}
