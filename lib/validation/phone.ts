/** Nigerian mobile numbers as typed on the keypad: 11 digits such as 0803 123 4567. */

export const LOCAL_NUMBER_LENGTH = 11;

export type PhoneCheck =
  | { valid: true; e164: string }
  | { valid: false; reason: "empty" | "must-start-with-0" | "too-short" | "not-a-mobile-number" };

export function sanitiseDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, LOCAL_NUMBER_LENGTH);
}

export function checkPhoneNumber(digits: string): PhoneCheck {
  if (digits.length === 0) return { valid: false, reason: "empty" };
  if (digits[0] !== "0") return { valid: false, reason: "must-start-with-0" };
  if (digits.length < LOCAL_NUMBER_LENGTH) return { valid: false, reason: "too-short" };
  // Mobile ranges begin 070, 071, 080, 081, 090 or 091.
  if (!/^0[789][01]\d{8}$/.test(digits)) return { valid: false, reason: "not-a-mobile-number" };
  return { valid: true, e164: `+234${digits.slice(1)}` };
}

/** 08031234567 -> 0803 123 4567, tolerating partly typed numbers. */
export function formatPhoneDigits(digits: string): string {
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter(Boolean).join(" ");
}
