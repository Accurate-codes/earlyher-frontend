/**
 * Calendar reminders as a downloadable .ics file. This is the only reminder mechanism
 * available: EarlyHer has no messaging or scheduling service, so the person adds the
 * event to their own calendar and nothing is claimed to have been sent.
 */

export interface CalendarReminder {
  title: string;
  description: string;
  /** Local calendar day of the reminder. */
  date: Date;
  repeat?: "monthly";
  /** Hour of the day the calendar should alert, local time. */
  alertHour?: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

function day(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function stamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(
    date.getUTCMinutes(),
  )}${pad(date.getUTCSeconds())}Z`;
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** Folds lines longer than 75 characters, as the iCalendar format requires. */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function buildIcs(reminder: CalendarReminder, now: Date): string {
  const start = new Date(reminder.date.getFullYear(), reminder.date.getMonth(), reminder.date.getDate());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EarlyHer//Reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 10)}@earlyher`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART;VALUE=DATE:${day(start)}`,
    `DTEND;VALUE=DATE:${day(addDays(start, 1))}`,
    `SUMMARY:${escapeText(reminder.title)}`,
    `DESCRIPTION:${escapeText(reminder.description)}`,
    ...(reminder.repeat === "monthly" ? ["RRULE:FREQ=MONTHLY"] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(reminder.title)}`,
    `TRIGGER:PT${reminder.alertHour ?? 9}H`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
