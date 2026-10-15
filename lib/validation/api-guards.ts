import type { Area, ExplanationResponse, Facility, SmsResponse } from "@/lib/types/api";

/** Runtime checks for everything that arrives from outside the frontend. */

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const optionalText = (value: unknown): string | undefined => (isText(value) ? value.trim() : undefined);

export const MAX_EXPLANATION_LENGTH = 700;

/**
 * Phrases an explanation must never contain. This is a last line of defence in the
 * browser; the backend remains responsible for constraining what the model can say.
 */
const UNSAFE_EXPLANATION_PATTERNS: RegExp[] = [
  /\byou\s+(?:\w+\s+){0,3}(?:have|don'?t have|do not have)\s+(?:\w+\s+){0,2}cancer\b/i,
  /\b(?:it|this|that|lump|change)\s+(?:is|isn'?t|is not|is probably|is likely|is unlikely to be)\s+(?:\w+\s+){0,2}(?:cancer(?:ous)?|malignant|benign)\b/i,
  /\b(?:malignant|benign)\b/i,
  /\bdiagnos(?:is|ed|e)\b/i,
  /\b(?:low|high|medium|moderate)[-\s]risk\b/i,
  /\brisk score\b/i,
  /\b\d+\s?(?:mg|ml|mcg|tablets?|capsules?)\b/i,
  /\b(?:prescri|antibiotic|tamoxifen|chemotherapy|paracetamol|ibuprofen)/i,
  /\bno need to (?:see|visit|worry)\b/i,
  /<[^>]+>/,
];

export function parseExplanation(value: unknown): ExplanationResponse | null {
  if (!isObject(value) || !isText(value.explanation)) return null;
  const explanation = value.explanation.trim();
  if (explanation.length > MAX_EXPLANATION_LENGTH) return null;
  if (UNSAFE_EXPLANATION_PATTERNS.some((pattern) => pattern.test(explanation))) return null;
  return { explanation };
}

export function parseAreas(value: unknown): Area[] | null {
  const list = isObject(value) ? value.areas : value;
  if (!Array.isArray(list)) return null;
  const areas: Area[] = [];
  for (const item of list) {
    if (!isObject(item) || !isText(item.id) || !isText(item.name)) return null;
    areas.push({ id: item.id, name: item.name.trim() });
  }
  return areas;
}

export function parseFacility(value: unknown): Facility | null {
  if (!isObject(value)) return null;
  if (!isText(value.id) || !isText(value.name) || !isText(value.type)) return null;
  if (!isText(value.areaId) || !isText(value.address)) return null;
  if (!isObject(value.verification)) return null;

  const verified = value.verification.status === "verified";
  const services = Array.isArray(value.services) ? value.services.filter(isText).map((s) => s.trim()) : [];
  const distance = typeof value.distanceKm === "number" && value.distanceKm >= 0 ? value.distanceKm : undefined;
  const publicUrl = optionalText(value.publicUrl);

  return {
    id: value.id,
    name: value.name.trim(),
    type: value.type.trim(),
    areaId: value.areaId,
    address: value.address.trim(),
    services,
    openingHours: optionalText(value.openingHours),
    // Contact details are dropped unless the backend marks the record as verified.
    phone: verified ? optionalText(value.phone) : undefined,
    directions: optionalText(value.directions),
    distanceKm: distance,
    publicUrl: publicUrl && /^https:\/\//i.test(publicUrl) ? publicUrl : undefined,
    verification: {
      status: verified ? "verified" : "unverified",
      verifiedOn: optionalText(value.verification.verifiedOn),
      source: optionalText(value.verification.source),
    },
    demo: value.demo === true ? true : undefined,
  };
}

export function parseFacilities(value: unknown): Facility[] | null {
  const list = isObject(value) ? value.facilities : value;
  if (!Array.isArray(list)) return null;
  const facilities: Facility[] = [];
  for (const item of list) {
    const facility = parseFacility(item);
    if (!facility) return null;
    facilities.push(facility);
  }
  return facilities;
}

export function parseSmsResponse(value: unknown): SmsResponse | null {
  if (!isObject(value)) return null;
  if (value.status !== "accepted" && value.status !== "queued") return null;
  return { status: value.status, messageId: optionalText(value.messageId) };
}
