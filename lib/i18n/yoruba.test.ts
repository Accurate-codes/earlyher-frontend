import { describe, expect, it } from "vitest";
import { triageText } from "@/content/en/triage";
import { ui } from "@/content/en/ui";
import { triageYo, triageYoReview } from "@/content/yo/triage";
import { uiYo, uiYoReview } from "@/content/yo/ui";
import { buildPath } from "@/lib/triage/flow";
import { QUESTIONS, type QuestionId, type TriageAnswers } from "@/lib/triage/questions";
import { evaluate } from "@/lib/triage/rules";
import { buildSummary } from "@/lib/triage/summary";
import { contentFor, yorubaStatus } from "./content";
import { fitTable, fitYorubaGlyphs } from "./yoruba";

/** Every string in a table, calling functions with sample arguments. */
function strings(node: unknown, path = ""): [string, string][] {
  if (typeof node === "string") return [[path, node]];
  if (typeof node === "function") {
    const fn = node as (...args: unknown[]) => unknown;
    let sample: unknown;
    try {
      sample = fn(3, 7, 2);
    } catch {
      sample = fn("ẹ̀ka", "ọjà", "Èkó");
    }
    return strings(sample, `${path}()`);
  }
  if (Array.isArray(node)) return node.flatMap((item, index) => strings(item, `${path}.${index}`));
  if (typeof node === "object" && node !== null) {
    return Object.entries(node).flatMap(([key, value]) => strings(value, path ? `${path}.${key}` : key));
  }
  return [];
}

/**
 * Characters the app font (app/fonts/PlusJakartaSans-latin-yoruba-var.woff2) covers,
 * matching the subset it was built with. Anything else would show in a fallback font.
 */
const FONT_RANGES: [number, number][] = [
  [0x0020, 0x00ff],
  [0x0100, 0x017f],
  [0x0300, 0x030f],
  [0x0323, 0x0323],
  [0x1e00, 0x1eff],
  [0x2000, 0x206f],
];
const covered = (char: string) => {
  const code = char.codePointAt(0)!;
  return code === 0x0a || FONT_RANGES.some(([from, to]) => code >= from && code <= to);
};

const yoruba = contentFor("yo");
const yorubaStrings = [...strings(yoruba.ui, "ui"), ...strings(yoruba.triage, "triage"), ...strings(yoruba.education, "learn")];

describe("Yoruba translation", () => {
  it("covers every interface, triage and education text", () => {
    const status = yorubaStatus();
    expect(status.missing).toEqual([]);
  });

  it("is honestly marked as a draft until reviewed", () => {
    expect(triageYoReview.status).not.toBe("approved");
    expect(uiYoReview.status).not.toBe("approved");
    expect(yorubaStatus().draft).toBe(true);
  });

  it("has no blank labels or raw keys", () => {
    for (const [path, text] of yorubaStrings) {
      expect(text.trim(), path).not.toBe("");
      expect(text, path).not.toMatch(/\b(undefined|null|NaN)\b|\[object|triage\.|ui\./);
    }
  });

  it("is actually Yoruba, with tone marks and the letters ẹ, ọ, ṣ", () => {
    const all = yorubaStrings.map(([, text]) => text).join(" ");
    for (const letter of ["ẹ", "ọ", "ṣ", "́", "̀"]) expect(all.normalize("NFD")).toContain(letter.normalize("NFD"));
    // Questions and results differ from English (not left untranslated by mistake).
    for (const id of Object.keys(QUESTIONS) as QuestionId[]) {
      expect(yoruba.triage.questions[id].prompt, id).not.toBe(triageText.questions[id].prompt);
    }
    for (const outcome of ["red", "orange", "yellow", "green", "review"] as const) {
      expect(yoruba.triage.results.outcomes[outcome].body).not.toBe(triageText.results.outcomes[outcome].body);
    }
  });

  it("uses only characters the app font can show", () => {
    for (const [path, text] of yorubaStrings) {
      const missing = [...text].filter((char) => !covered(char));
      expect(missing, path).toEqual([]);
    }
  });

  it("writes ǹ and ḿ as a letter plus a tone mark, which the font supports", () => {
    expect(fitYorubaGlyphs("nǹkan")).toBe("nǹkan");
    expect(fitYorubaGlyphs("ḿ")).toBe("ḿ");
    expect(fitTable({ a: "ǹ", f: (x: string) => `${x}ǹ` }).f("a")).toBe("aǹ");
    expect(yorubaStrings.some(([, text]) => /[ǸǹḾḿ]/.test(text))).toBe(false);
  });

  it("keeps the placeholders of every sentence with numbers or names", () => {
    expect(yoruba.ui.session.idleText(30)).toContain("30");
    expect(yoruba.ui.finder.results(5, 9)).toMatch(/5.*9/);
    expect(yoruba.ui.finder.coverage(1200, "Lagos")).toMatch(/1,200.*Lagos/);
    expect(yoruba.triage.results.moreReasons(2)).toContain("2");
    expect(yoruba.triage.welcome.emergencyCall("112")).toContain("112");
    expect(yoruba.triage.summary.generated("23 October 2026")).toContain("23 October 2026");
  });

  it("keeps timeframes the same as English", () => {
    const outcomes = yoruba.triage.results.outcomes;
    expect(outcomes.red.timeframe).toMatch(/24/);
    expect(outcomes.orange.timeframe).toMatch(/1/);
    expect(outcomes.yellow.timeframe).toMatch(/4/);
    expect(outcomes.yellow.label).toMatch(/4/);
    // The disclaimer keeps "not a diagnosis".
    expect(yoruba.triage.footer.text).toMatch(/kì í ṣe ìdámọ̀ àìsàn/);
  });

  it("does not put cancer wording in result headlines", () => {
    for (const outcome of Object.values(yoruba.triage.results.outcomes)) expect(outcome.headline).not.toMatch(/jẹjẹrẹ/);
    expect(yoruba.triage.welcome.concernTitle).not.toMatch(/jẹjẹrẹ/);
  });

  it("leaves the staff-only panel in English", () => {
    expect(yoruba.ui.dev).toBe(ui.dev);
  });

  it("has the same structure as English for arrays shown side by side", () => {
    expect(triageYo.selfCheck?.signs).toHaveLength(triageText.selfCheck.signs.length);
    expect(triageYo.results?.bring).toHaveLength(triageText.results.bring.length);
    expect(triageYo.privacy?.points).toHaveLength(triageText.privacy.points.length);
    expect(triageYo.illustrations?.mirrorPositions).toHaveLength(triageText.illustrations.mirrorPositions.length);
    expect(Object.keys(uiYo.sms?.errors ?? {})).toEqual(Object.keys(ui.sms.errors));
  });
});

describe("same answers, same result in both languages", () => {
  const cases: Record<string, string | string[]>[] = [
    { Q1: ["A"], Q1b: "25to39", R1: "no", R2: "no", R3: "none", R4: ["bonePain"], R5: "no", A1: "right", A2R: "upperOuter", A3: "lt1week", A5: "yes", A6: "soft", A7: "smooth", A8: "moves", A9: "no", H5: "never" },
    { Q1: ["C"], Q1b: "under25", R1: "feverish", R2: "recent" },
    { Q1: ["N"], Q1b: "50to69", N1: "monthly", N2: "normal", N3: "normal", N4: "never" },
    { Q1: ["B"], Q1b: "40to49", R1: "no", R2: "no", R3: "none", R4: ["none"], R5: "no", B1: "yes", B2: "one", B2side: "left", B3: "one", B4: "bloody", B5: "no", B6: "no", B7: ["none"], B8: "no" },
  ];

  it("gives the same outcome, reasons and summary rows", () => {
    for (const answers of cases) {
      const entry = (answers.Q1 as string[])[0] === "N" ? "no-concern" : "concern";
      const path = buildPath({ entry, answers: answers as TriageAnswers, continuedFrom: null });
      const evaluation = evaluate(path.answers);
      const en = buildSummary(path, evaluation, contentFor("en").triage);
      const yo = buildSummary(path, evaluation, contentFor("yo").triage);
      expect(yo.outcome).toBe(en.outcome);
      expect(yo.reasons).toHaveLength(en.reasons.length);
      expect(yo.sections.map((section) => [section.id, section.rows.length])).toEqual(
        en.sections.map((section) => [section.id, section.rows.length]),
      );
      for (const line of [...yo.reasons, ...yo.sections.flatMap((section) => section.rows.map((row) => row.value))]) {
        expect(line.trim()).not.toBe("");
      }
    }
  });
});
