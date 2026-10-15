/**
 * Proposed request and response shapes for the Python backend.
 * These are the frontend's working assumptions, not an agreed contract:
 * confirm names, fields and status codes with the backend developer.
 */

export type ServiceErrorKind =
  | "offline" // The device has no connection; nothing was sent.
  | "timeout" // No answer within the adapter's time limit.
  | "unavailable" // The service or its data source is not available.
  | "invalid-response" // The answer did not match the expected shape or failed a safety check.
  | "server" // The service answered with an error status.
  | "aborted"; // The session ended before the answer arrived.

export type ServiceResult<T> =
  | {
      ok: true;
      data: T;
      /** True when a mock adapter produced this. The interface must say so. */
      simulated: boolean;
    }
  | { ok: false; error: ServiceErrorKind };

// --- AI explanation: POST /v1/explanations -----------------------------------

/** Identifiers only. No answers, free text or phone numbers are sent to the AI service. */
export interface ExplanationRequest {
  recommendationId: string;
  pathwayId: string;
  pathwayVersion: string;
  questionBankVersion: string;
  locale: string;
}

export interface ExplanationResponse {
  /** Plain-language explanation of the already-approved next step. */
  explanation: string;
}

// --- Facilities: GET /v1/areas, GET /v1/facilities?area_id=, GET /v1/facilities/{id}

export interface Area {
  id: string;
  name: string;
}

export interface FacilityVerification {
  status: "verified" | "unverified";
  verifiedOn?: string;
  source?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  areaId: string;
  address: string;
  services: string[];
  openingHours?: string;
  /** Only shown when the verification status is "verified". */
  phone?: string;
  directions?: string;
  /** Only present when the backend has reliable location data. */
  distanceKm?: number;
  /** Public page for this facility, used for the QR code. */
  publicUrl?: string;
  verification: FacilityVerification;
  /** True for fictional layout fixtures. */
  demo?: boolean;
}

// --- SMS: POST /v1/sms --------------------------------------------------------

export interface SmsRequest {
  /** E.164 format, for example +2348012345678. */
  phoneNumber: string;
  /** The backend owns the final wording; the frontend names a template, not free text. */
  templateId: "next-step" | "facility";
  recommendationId?: string;
  facilityId?: string;
  pathwayVersion?: string;
  locale: string;
}

export interface SmsResponse {
  /**
   * "accepted" and "queued" mean the provider took the message, not that it arrived.
   * The frontend never reports delivery without a delivery status from the backend.
   */
  status: "accepted" | "queued";
  messageId?: string;
}
