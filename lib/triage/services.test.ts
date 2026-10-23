import { describe, expect, it } from "vitest";
import { bookingOffer, slotsInWindow, type BookingSlot } from "@/lib/services/booking";
import { createSessionStore } from "@/lib/session/session-store";
import { commitTriage, setSaveOnDevice, triageFor, updateTriage } from "@/lib/session/actions";
import { localeStore } from "@/lib/i18n/locale-store";
import { addDays, buildIcs } from "./calendar";
import { acceptConsent, advance, createTriage, setAnswer } from "./flow";
import { clearProgress, hasSavedProgress, loadProgress, SAVE_KEY, SAVE_TTL_MS, saveProgress, type StorageLike } from "./persistence";
import { createTextPdf, toWinAnsi, wrap } from "./pdf";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const NOW = new Date("2026-10-23T10:00:00Z");

function savedState() {
  let state = acceptConsent(createTriage("concern"), NOW);
  state = setAnswer(state, "Q1", ["A"]);
  state = advance(state, "Q1")!;
  return { ...state, save: { consentedAt: NOW.toISOString() } };
}

describe("saved progress", () => {
  it("is saved only with permission", () => {
    const storage = memoryStorage();
    const { save: _save, ...rest } = savedState();
    void _save;
    expect(saveProgress(storage, { ...rest, save: null }, NOW.getTime())).toBe(false);
    expect(storage.data.size).toBe(0);
  });

  it("restores answers and position within 7 days", () => {
    const storage = memoryStorage();
    saveProgress(storage, savedState(), NOW.getTime());
    const restored = loadProgress(storage, NOW.getTime() + SAVE_TTL_MS - 1000);
    expect(restored?.answers.Q1).toEqual(["A"]);
    expect(restored?.cursor).toBe("Q1b");
  });

  it("expires after 7 days and deletes the copy", () => {
    const storage = memoryStorage();
    saveProgress(storage, savedState(), NOW.getTime());
    expect(hasSavedProgress(storage, NOW.getTime() + SAVE_TTL_MS + 1)).toBe(false);
    expect(loadProgress(storage, NOW.getTime() + SAVE_TTL_MS + 1)).toBeNull();
    expect(storage.data.has(SAVE_KEY)).toBe(false);
  });

  it("discards damaged copies and invalid answers", () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, "{not json");
    expect(loadProgress(storage, NOW.getTime())).toBeNull();
    saveProgress(storage, { ...savedState(), answers: { Q1: ["A"], A6: "enormous" } as never }, NOW.getTime());
    expect(loadProgress(storage, NOW.getTime())?.answers).toEqual({ Q1: ["A"] });
  });

  it("is deleted when saving is turned off", () => {
    const storage = memoryStorage();
    const store = createSessionStore();
    commitTriage(store, savedState(), storage);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    setSaveOnDevice(store, false, NOW, storage);
    expect(storage.data.has(SAVE_KEY)).toBe(false);
    expect(store.getState().triage?.save).toBeNull();
    clearProgress(storage);
  });

  it("follows every change while saving is on", () => {
    const storage = memoryStorage();
    const store = createSessionStore();
    commitTriage(store, savedState(), storage);
    updateTriage(store, (s) => setAnswer(s, "Q1b", "50to69"), storage);
    expect(loadProgress(storage, Date.now())?.answers.Q1b).toBe("50to69");
  });
});

describe("session and language", () => {
  it("keeps answers and position when the language changes", () => {
    const store = createSessionStore();
    commitTriage(store, savedState(), null);
    const before = store.getState().triage;
    localeStore.set("yo");
    localeStore.set("en");
    expect(store.getState().triage).toBe(before);
  });

  it("entry buttons start their own journey and switch an existing one", () => {
    const store = createSessionStore();
    expect(triageFor(store, "no-concern").answers).toEqual({ Q1: ["N"] });
    commitTriage(store, savedState(), null);
    expect(triageFor(store, "no-concern").entry).toBe("no-concern");
    expect(triageFor(store, "concern")).toBe(store.getState().triage);
  });

  it("clears the triage on reset", () => {
    const store = createSessionStore();
    commitTriage(store, savedState(), null);
    store.reset();
    expect(store.getState().triage).toBeNull();
    expect(store.hasData()).toBe(false);
  });
});

describe("booking windows", () => {
  const slot = (days: number): BookingSlot => ({
    id: `s${days}`,
    start: new Date(NOW.getTime() + days * 86400000).toISOString(),
    facilityId: "f",
    facilityName: "Facility",
  });
  const slots = [slot(30), slot(3), slot(10), slot(-1)];

  it("offers Orange slots within 7 days and Yellow within 28", () => {
    expect(slotsInWindow(slots, "orange", NOW).map((s) => s.id)).toEqual(["s3"]);
    expect(slotsInWindow(slots, "yellow", NOW).map((s) => s.id)).toEqual(["s3", "s10"]);
    expect(slotsInWindow(slots, "green", NOW).map((s) => s.id)).toEqual(["s3", "s10", "s30"]);
  });

  it("never offers a booking in place of urgent care or for an unresolved result", () => {
    expect(slotsInWindow(slots, "red", NOW)).toEqual([]);
    expect(bookingOffer({ ok: true, data: slots, simulated: true }, "review", NOW)).toEqual({ status: "unavailable" });
  });

  it("reports no timely slot, and failures as unavailable", () => {
    expect(bookingOffer({ ok: true, data: [slot(10)], simulated: false }, "orange", NOW)).toEqual({ status: "no-timely-slot" });
    expect(bookingOffer({ ok: false, error: "timeout" }, "orange", NOW)).toEqual({ status: "unavailable" });
    expect(bookingOffer(null, "yellow", NOW)).toEqual({ status: "unavailable" });
  });
});

describe("calendar reminders", () => {
  it("creates an all-day event with an alert, monthly when asked", () => {
    const ics = buildIcs({ title: "Check, again; please", description: "Line one\nLine two", date: addDays(NOW, 14), repeat: "monthly" }, NOW);
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics).toContain(`DTSTART;VALUE=DATE:${addDays(NOW, 14).getFullYear()}`);
    expect(ics).toContain("SUMMARY:Check\\, again\\; please");
    expect(ics).toContain("DESCRIPTION:Line one\\nLine two");
    expect(ics).toContain("RRULE:FREQ=MONTHLY");
    expect(ics).toContain("TRIGGER:PT9H");
  });

  it("adds whole days", () => {
    const tomorrow = addDays(new Date(2026, 11, 31, 22), 1);
    expect([tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()]).toEqual([2027, 0, 1]);
  });
});

describe("summary PDF", () => {
  it("writes a valid PDF whose cross-reference offsets point at each object", () => {
    const lines = Array.from({ length: 120 }, (_, i) => ({ text: `Line ${i} — “quoted” text with é and ẹ`, bold: i % 10 === 0 }));
    const bytes = createTextPdf("Summary", lines);
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    const xrefAt = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(xrefAt, xrefAt + 4)).toBe("xref");
    const offsets = [...text.slice(xrefAt).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    offsets.forEach((offset, index) => expect(text.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true));
    expect(Number(text.match(/\/Count (\d+)/)![1])).toBeGreaterThan(1);
  });

  it("maps punctuation to WinAnsi and drops unsupported marks", () => {
    expect(toWinAnsi("’–é")).toEqual([0x92, 0x96, 0xe9]);
    expect(toWinAnsi("ẹ")).toEqual([0x65]);
  });

  it("wraps long text to the page width", () => {
    const lines = wrap("word ".repeat(80), 11, false, 480);
    expect(lines.length).toBeGreaterThan(2);
  });
});
