import type { FacilityRecord, FieldValue, LatLng } from "@/lib/types/facility";

/** Pure helpers for searching, sorting and describing facilities. No network, no storage. */

export function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Every word typed must appear in the facility's name, ward, LGA, address or type. */
export function matchesQuery(facility: FacilityRecord, query: string): boolean {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalise(
    [facility.name, facility.ward, facility.lga, facility.address, facility.facilityType]
      .map((f) => f?.value ?? "")
      .join(" "),
  );
  return words.every((word) => haystack.includes(word));
}

export interface FacilityFilter {
  query: string;
  /** LGA name, or "" for all. */
  lga: string;
}

export function filterFacilities(facilities: FacilityRecord[], filter: FacilityFilter): FacilityRecord[] {
  return facilities.filter(
    (facility) => (!filter.lga || facility.lga?.value === filter.lga) && matchesQuery(facility, filter.query),
  );
}

/** LGA names present in the data, alphabetically. Only offered when the data has them. */
export function listLgas(facilities: FacilityRecord[]): string[] {
  const names = new Set<string>();
  for (const facility of facilities) if (facility.lga) names.add(facility.lga.value);
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Great-circle ("as the crow flies") distance in kilometres. Not a travel distance. */
export function straightLineKm(from: LatLng, to: LatLng): number {
  const R = 6371;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(to.lat - from.lat);
  const dLng = rad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Distance only when both points are known; otherwise null so nothing is shown. */
export function distanceTo(facility: FacilityRecord, origin: LatLng | null): number | null {
  if (!origin || !facility.location) return null;
  return straightLineKm(origin, facility.location.value);
}

export function sortFacilities(facilities: FacilityRecord[], origin: LatLng | null): FacilityRecord[] {
  if (!origin) return [...facilities].sort((a, b) => a.name.value.localeCompare(b.name.value));
  const withDistance = facilities.map((facility) => ({ facility, km: distanceTo(facility, origin) }));
  withDistance.sort((a, b) => {
    if (a.km === null && b.km === null) return a.facility.name.value.localeCompare(b.facility.name.value);
    if (a.km === null) return 1;
    if (b.km === null) return -1;
    return a.km - b.km;
  });
  return withDistance.map((item) => item.facility);
}

/**
 * Phone numbers, hours and services are shown only once someone has verified them.
 * Unverified values are treated as unavailable.
 */
export function verifiedValue<T>(field: FieldValue<T> | null): T | null {
  return field?.verifiedOn ? field.value : null;
}

/** Google Maps links built from the dataset's coordinates (preferred) or a verified-source address. */
export function directionsUrl(facility: FacilityRecord): string | null {
  const destination = mapsQuery(facility);
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
}

export function openMapUrl(facility: FacilityRecord): string | null {
  const query = mapsQuery(facility);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

function mapsQuery(facility: FacilityRecord): string | null {
  if (facility.location) return `${facility.location.value.lat},${facility.location.value.lng}`;
  if (facility.address) return `${facility.address.value}, ${facility.lga?.value ?? ""} ${facility.state?.value ?? ""}`.trim();
  return null;
}
