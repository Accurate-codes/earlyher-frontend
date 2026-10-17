import type {
  FacilityDataset,
  FacilityFlag,
  FacilityRecord,
  FacilitySourceId,
  FacilitySourceInfo,
  FieldValue,
} from "@/lib/types/facility";

/**
 * Reads the compact snapshot written by scripts/import-grid3-lagos.mjs and expands it
 * into the internal facility structure. Anything malformed is dropped rather than guessed.
 */

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const KNOWN_SOURCES: FacilitySourceId[] = ["grid3-nga-hf-v2", "hfr", "osm", "curated"];
const KNOWN_FLAGS: FacilityFlag[] = ["lga-name-disagreement", "ward-name-disagreement", "uncertain-match"];

function field(value: unknown, source: FacilitySourceId, origin?: unknown): FieldValue<string> | null {
  const v = text(value);
  if (!v) return null;
  const o = text(origin);
  return o ? { value: v, source, origin: o } : { value: v, source };
}

function parseSource(value: unknown): FacilitySourceInfo | null {
  if (!isObject(value)) return null;
  const id = text(value.id) as FacilitySourceId | null;
  if (!id || !KNOWN_SOURCES.includes(id)) return null;
  const required = ["name", "publisher", "url", "licence", "licenceUrl", "attribution", "retrievedOn", "limitations"] as const;
  if (required.some((key) => !text(value[key]))) return null;
  return {
    id,
    name: text(value.name)!,
    publisher: text(value.publisher)!,
    version: text(value.version) ?? undefined,
    released: text(value.released) ?? undefined,
    url: text(value.url)!,
    doi: text(value.doi) ?? undefined,
    licence: text(value.licence)!,
    licenceUrl: text(value.licenceUrl)!,
    attribution: text(value.attribution)!,
    retrievedOn: text(value.retrievedOn)!,
    limitations: text(value.limitations)!,
  };
}

function inRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function parseRecord(value: unknown, source: FacilitySourceInfo): FacilityRecord | null {
  if (!isObject(value)) return null;
  const id = text(value.id);
  const name = field(value.name, source.id, value.nameOrigin);
  if (!id || !name) return null;

  // Nigeria lies roughly within 4–14°N, 2–15°E; anything outside is treated as missing.
  const hasLocation = inRange(value.lat, 4, 14) && inRange(value.lng, 2, 15);
  const flags = Array.isArray(value.flags)
    ? value.flags.filter((flag): flag is FacilityFlag => KNOWN_FLAGS.includes(flag as FacilityFlag))
    : [];
  const recordId = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;

  return {
    id,
    hfrCode: text(value.hfrCode),
    name,
    facilityType: field(value.type, source.id),
    level: field(value.level, source.id),
    ownership: field(value.ownership, source.id),
    ownershipType: field(value.ownershipType, source.id),
    state: field(value.state, source.id),
    lga: field(value.lga, source.id),
    ward: field(value.ward, source.id),
    // The GRID3 dataset has no addresses, phone numbers, hours or services.
    address: field(value.address, source.id),
    location: hasLocation
      ? {
          value: { lat: value.lat as number, lng: value.lng as number },
          source: source.id,
          ...(text(value.coordinatesOrigin) ? { origin: text(value.coordinatesOrigin)! } : {}),
        }
      : null,
    phone: null,
    openingHours: null,
    services: null,
    sources: [
      {
        source: source.id,
        recordId,
        url: source.url,
        sourceUpdated: text(value.sourceUpdated) ?? undefined,
        retrievedOn: source.retrievedOn,
      },
    ],
    verification: { status: "unverified" },
    flags,
  };
}

export function parseSnapshot(value: unknown): FacilityDataset | null {
  if (!isObject(value) || value.schema !== 1 || !Array.isArray(value.records) || !Array.isArray(value.sources)) {
    return null;
  }
  const coverage = isObject(value.coverage) ? value.coverage : null;
  const state = text(coverage?.state);
  const country = text(coverage?.country);
  const generatedOn = text(value.generatedOn);
  const sources = value.sources.map(parseSource).filter((s): s is FacilitySourceInfo => s !== null);
  if (!state || !country || !generatedOn || sources.length === 0) return null;

  // A snapshot is built from one primary source; later merges will carry per-field sources.
  const primary = sources[0];
  const records = value.records
    .map((record) => parseRecord(record, primary))
    .filter((r): r is FacilityRecord => r !== null);

  return { coverage: { state, country }, generatedOn, sources, records };
}
