import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FacilityRecord } from "@/lib/types/facility";
import {
  directionsUrl,
  distanceTo,
  filterFacilities,
  listLgas,
  matchesQuery,
  openMapUrl,
  sortFacilities,
  straightLineKm,
  verifiedValue,
} from "./search";
import { parseSnapshot } from "./snapshot";

const raw = JSON.parse(readFileSync("public/data/facilities-lagos.json", "utf8"));
const dataset = parseSnapshot(raw)!;

function record(id: string, name: string, extra: Partial<FacilityRecord> = {}): FacilityRecord {
  return {
    id,
    hfrCode: null,
    name: { value: name, source: "grid3-nga-hf-v2" },
    facilityType: null,
    level: null,
    ownership: null,
    ownershipType: null,
    state: { value: "Lagos", source: "grid3-nga-hf-v2" },
    lga: null,
    ward: null,
    address: null,
    location: null,
    phone: null,
    openingHours: null,
    services: null,
    sources: [{ source: "grid3-nga-hf-v2", recordId: id, retrievedOn: "2026-10-17" }],
    verification: { status: "unverified" },
    flags: [],
    ...extra,
  };
}

describe("Lagos snapshot", () => {
  it("parses into the internal structure with source, licence and dates", () => {
    expect(dataset).not.toBeNull();
    expect(dataset.coverage.state).toBe("Lagos");
    expect(dataset.records.length).toBeGreaterThan(0);
    const [source] = dataset.sources;
    expect(source).toMatchObject({ id: "grid3-nga-hf-v2", licence: "CC BY 4.0" });
    expect(source.attribution).toMatch(/CIESIN/);
    expect(source.retrievedOn).toBe(dataset.generatedOn);
  });

  it("contains only Lagos records, each with an id, a name and a location inside Lagos", () => {
    for (const facility of dataset.records) {
      expect(facility.state?.value).toBe("Lagos");
      expect(facility.id).toMatch(/^grid3:/);
      expect(facility.name.value.length).toBeGreaterThan(0);
      if (facility.location) {
        expect(facility.location.value.lat).toBeGreaterThan(6.2);
        expect(facility.location.value.lat).toBeLessThan(6.8);
        expect(facility.location.value.lng).toBeGreaterThan(2.6);
        expect(facility.location.value.lng).toBeLessThan(4.4);
      }
    }
    expect(new Set(dataset.records.map((f) => f.id)).size).toBe(dataset.records.length);
  });

  it("invents no addresses, phone numbers, hours, services or verification", () => {
    for (const facility of dataset.records) {
      expect(facility.address).toBeNull();
      expect(facility.phone).toBeNull();
      expect(facility.openingHours).toBeNull();
      expect(facility.services).toBeNull();
      expect(facility.verification.status).toBe("unverified");
      expect(facility.location?.verifiedOn).toBeUndefined();
    }
  });

  it("keeps a retrieval date separate from the source's own update date", () => {
    const ref = dataset.records[0].sources[0];
    expect(ref.retrievedOn).toBe(dataset.generatedOn);
    expect(ref.sourceUpdated).not.toBe(ref.retrievedOn);
  });

  it("rejects malformed snapshots", () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot({ ...raw, schema: 2 })).toBeNull();
    expect(parseSnapshot({ ...raw, sources: [] })).toBeNull();
  });
});

describe("search", () => {
  const a = record("a", "Surulere General Hospital", {
    lga: { value: "Surulere", source: "grid3-nga-hf-v2" },
    ward: { value: "Itire", source: "grid3-nga-hf-v2" },
    location: { value: { lat: 6.5, lng: 3.35 }, source: "grid3-nga-hf-v2" },
  });
  const b = record("b", "Ikeja Clinic", {
    lga: { value: "Ikeja", source: "grid3-nga-hf-v2" },
    location: { value: { lat: 6.6, lng: 3.34 }, source: "grid3-nga-hf-v2" },
  });
  const c = record("c", "Àdùnní Health Post", { lga: { value: "Ikeja", source: "grid3-nga-hf-v2" } });

  it("matches every word across name, ward and LGA, ignoring case and accents", () => {
    expect(matchesQuery(a, "surulere itire")).toBe(true);
    expect(matchesQuery(a, "ikeja")).toBe(false);
    expect(matchesQuery(c, "adunni")).toBe(true);
  });

  it("filters by LGA and lists LGAs present in the data", () => {
    expect(filterFacilities([a, b, c], { query: "", lga: "Ikeja" }).map((f) => f.id)).toEqual(["b", "c"]);
    expect(listLgas([a, b, c])).toEqual(["Ikeja", "Surulere"]);
  });

  it("gives a straight-line distance only when both points are known", () => {
    const origin = { lat: 6.6, lng: 3.34 };
    expect(distanceTo(b, origin)).toBeCloseTo(0, 5);
    expect(distanceTo(a, null)).toBeNull();
    expect(distanceTo(c, origin)).toBeNull();
    // Ikeja to Surulere, about 11 km as the crow flies.
    expect(straightLineKm(origin, a.location!.value)).toBeGreaterThan(10);
    expect(straightLineKm(origin, a.location!.value)).toBeLessThan(13);
  });

  it("sorts by distance with unlocated facilities last, or by name without a location", () => {
    expect(sortFacilities([c, a, b], { lat: 6.6, lng: 3.34 }).map((f) => f.id)).toEqual(["b", "a", "c"]);
    expect(sortFacilities([b, c, a], null).map((f) => f.id)).toEqual(["c", "b", "a"]);
  });
});

describe("display rules", () => {
  it("shows phone numbers and hours only when verified", () => {
    expect(verifiedValue({ value: "0800", source: "osm" })).toBeNull();
    expect(verifiedValue({ value: "0800", source: "curated", verifiedOn: "2026-10-01", verifiedBy: "team" })).toBe("0800");
    expect(verifiedValue(null)).toBeNull();
  });

  it("builds Google Maps links from coordinates, and none without a location or address", () => {
    const located = record("x", "X", { location: { value: { lat: 6.45744, lng: 3.36831 }, source: "grid3-nga-hf-v2" } });
    expect(directionsUrl(located)).toBe("https://www.google.com/maps/dir/?api=1&destination=6.45744%2C3.36831");
    expect(openMapUrl(located)).toBe("https://www.google.com/maps/search/?api=1&query=6.45744%2C3.36831");
    expect(directionsUrl(record("y", "Y"))).toBeNull();
  });
});
