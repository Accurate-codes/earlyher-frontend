import type { Outcome } from "@/lib/triage/rules";
import type { ServiceResult } from "@/lib/types/api";

/**
 * Appointment booking: integration point only. EarlyHer currently offers facility
 * navigation, not booking, so `bookingService` is null and the results screen shows
 * no booking actions. When a real provider is connected, implement BookingService and
 * export it here; the window rules below decide which slots may be offered.
 *
 * Proposed contract, not agreed with any provider. A booking is confirmed to the
 * person only after `book` returns ok.
 */

export interface BookingSlot {
  id: string;
  /** ISO 8601 start time from the provider. */
  start: string;
  facilityId: string;
  facilityName: string;
}

export interface BookingRequest {
  slotId: string;
  /** Collected only at this point, and only when booking is available. */
  name: string;
  phone: string;
  area: string;
  /** Only with the person's explicit permission for this booking. */
  shareSummary: boolean;
}

export interface BookingService {
  findSlots(input: { outcome: Outcome; area?: string }, signal?: AbortSignal): Promise<ServiceResult<BookingSlot[]>>;
  book(request: BookingRequest, signal?: AbortSignal): Promise<ServiceResult<{ confirmationId: string; start: string }>>;
}

/** No booking provider is connected. */
export const bookingService: BookingService | null = null;

/** Days within which a visit must start. Red never waits for a booking; review has no approved timeframe. */
const WINDOW_DAYS: Partial<Record<Outcome, number>> = { orange: 7, yellow: 28 };

export function canBook(outcome: Outcome): boolean {
  return outcome === "orange" || outcome === "yellow" || outcome === "green";
}

/** Slots that start inside the outcome's window (Green: any future slot). */
export function slotsInWindow(slots: BookingSlot[], outcome: Outcome, now: Date): BookingSlot[] {
  if (!canBook(outcome)) return [];
  const days = WINDOW_DAYS[outcome];
  const latest = days === undefined ? Infinity : now.getTime() + days * 24 * 60 * 60 * 1000;
  return slots
    .filter((slot) => {
      const start = Date.parse(slot.start);
      return Number.isFinite(start) && start > now.getTime() && start <= latest;
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

export type BookingOffer =
  | { status: "unavailable" }
  | { status: "no-timely-slot" }
  | { status: "slots"; slots: BookingSlot[] };

/** What to offer after a slot search. Failures and empty windows are reported honestly. */
export function bookingOffer(result: ServiceResult<BookingSlot[]> | null, outcome: Outcome, now: Date): BookingOffer {
  if (!result || !result.ok || !canBook(outcome)) return { status: "unavailable" };
  const slots = slotsInWindow(result.data, outcome, now);
  return slots.length ? { status: "slots", slots } : { status: "no-timely-slot" };
}
