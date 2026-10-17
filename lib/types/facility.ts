/**
 * The one internal facility structure every source is converted into, so sources can
 * be added or replaced without changing the interface. Unknown fields stay null.
 *
 * Provenance is kept per field: a merged record can take its name from one source and
 * its coordinates from another, and the interface can still say where each came from.
 * A retrieval date is not a verification date; only `verifiedOn` records verification.
 */

export type FacilitySourceId =
  | "grid3-nga-hf-v2" // GRID3 NGA – Health Facilities v2.0 (CC BY 4.0)
  | "hfr" // Nigeria Health Facility Registry API (key required; not yet connected)
  | "osm" // OpenStreetMap / healthsites.io (ODbL; not yet connected)
  | "curated"; // A list checked by the EarlyHer team (none exists yet)

export interface FieldValue<T> {
  value: T;
  source: FacilitySourceId;
  /** Upstream origin the source itself reports, e.g. GRID3's "NHFR_2024" or "GRID3_EHEALTH". */
  origin?: string;
  /** Set only when someone actually checked this value. Never a download date. */
  verifiedOn?: string;
  verifiedBy?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FacilitySourceRef {
  source: FacilitySourceId;
  /** The record's identifier in that source. */
  recordId: string;
  url?: string;
  /** When the source says it last changed the record. */
  sourceUpdated?: string;
  /** When EarlyHer downloaded it. */
  retrievedOn: string;
}

export type FacilityVerification =
  | { status: "unverified" }
  | { status: "verified"; verifiedOn: string; verifiedBy: string; method: string };

export type FacilityFlag =
  /** The source's inputs disagreed about the LGA name. */
  | "lga-name-disagreement"
  /** The source's inputs disagreed about the ward name. */
  | "ward-name-disagreement"
  /** Joined to another source by something weaker than a registry code; needs review. */
  | "uncertain-match";

export interface FacilityRecord {
  /** Internal id, prefixed with the source it was first created from. */
  id: string;
  /** Health Facility Registry code, when a source supplies one. Not unique in every source. */
  hfrCode: string | null;
  name: FieldValue<string>;
  facilityType: FieldValue<string> | null;
  level: FieldValue<string> | null;
  ownership: FieldValue<string> | null;
  ownershipType: FieldValue<string> | null;
  state: FieldValue<string> | null;
  lga: FieldValue<string> | null;
  ward: FieldValue<string> | null;
  address: FieldValue<string> | null;
  location: FieldValue<LatLng> | null;
  /** Shown only when verified. */
  phone: FieldValue<string> | null;
  /** Shown only when verified. */
  openingHours: FieldValue<string> | null;
  /** Shown only when verified. A general listing never proves specialist breast care. */
  services: FieldValue<string[]> | null;
  sources: FacilitySourceRef[];
  verification: FacilityVerification;
  flags: FacilityFlag[];
}

export interface FacilitySourceInfo {
  id: FacilitySourceId;
  name: string;
  publisher: string;
  version?: string;
  released?: string;
  url: string;
  doi?: string;
  licence: string;
  licenceUrl: string;
  attribution: string;
  retrievedOn: string;
  limitations: string;
}

export interface FacilityDataset {
  coverage: { state: string; country: string };
  /** When this snapshot was built. */
  generatedOn: string;
  sources: FacilitySourceInfo[];
  records: FacilityRecord[];
}
