import type { TriageText } from "@/content/en/triage";
import type { Path } from "./flow";
import type { PdfLine } from "./pdf";
import { QUESTION_IDS, type QuestionId } from "./questions";
import type { Evaluation, Outcome } from "./rules";

/**
 * The doctor summary: what the person told us, in their own answer wording, with
 * uncertainty and duration ranges kept exactly as chosen. Built only from answers on
 * the current path, so hidden or out-of-date answers never appear.
 */

export type SummarySectionId = keyof TriageText["summary"]["sections"];

export interface SummaryRow {
  question: QuestionId | "A2";
  label: string;
  value: string;
  notAsked?: boolean;
}

export interface SummarySection {
  id: SummarySectionId;
  title: string;
  rows: SummaryRow[];
}

export interface TriageSummary {
  outcome: Outcome;
  headline: string;
  timeframe: string;
  reasons: string[];
  advice: string[];
  incomplete: boolean;
  sections: SummarySection[];
}

function sectionOf(id: QuestionId): SummarySectionId {
  if (id === "Q1" || id === "Q1b") return "about";
  switch (id[0]) {
    case "N":
      return "selfCheck";
    case "R":
      return "safety";
    case "A":
      return "lump";
    case "B":
      return "fluid";
    case "C":
      return "pain";
    case "D":
      return "skin";
    default:
      return "history";
  }
}

const ORDER: SummarySectionId[] = ["about", "selfCheck", "safety", "lump", "fluid", "pain", "skin", "history"];

/** Wording of a stored answer, as the person chose it. */
export function answerLabel(text: TriageText, id: QuestionId, value: string | string[]): string {
  const options = text.questions[id].options as Record<string, string>;
  return (Array.isArray(value) ? value : [value]).map((option) => options[option] ?? option).join("; ");
}

export function buildSummary(path: Path, evaluation: Evaluation, text: TriageText): TriageSummary {
  const rows = new Map<SummarySectionId, SummaryRow[]>();
  const add = (section: SummarySectionId, row: SummaryRow) => rows.set(section, [...(rows.get(section) ?? []), row]);
  const answers = path.answers as Record<string, string | string[] | undefined>;
  const notAsked = new Set(path.notAsked);
  const notAskedText = text.summary.notAskedReasons;

  for (const id of QUESTION_IDS) {
    const value = answers[id];
    if (value !== undefined) {
      add(sectionOf(id), { question: id, label: text.questions[id].summary, value: answerLabel(text, id, value) });
      continue;
    }
    // Explain only the skips a doctor might otherwise ask about.
    if (id === "A2R" && notAsked.has("A2R") && notAsked.has("A2L")) {
      add("lump", { question: "A2", label: text.summary.locationLabel, value: notAskedText.A2, notAsked: true });
    } else if ((id === "A4" || id === "B8" || id === "C6") && notAsked.has(id)) {
      add(sectionOf(id), { question: id, label: text.questions[id].summary, value: notAskedText[id], notAsked: true });
    }
  }

  const outcome = text.results.outcomes[evaluation.outcome];
  return {
    outcome: evaluation.outcome,
    headline: outcome.headline,
    timeframe: outcome.timeframe,
    reasons: evaluation.reasons.map((key) => text.results.reasons[key]),
    advice: evaluation.advice.map((key) => text.results.advice[key]),
    incomplete: path.end === "red-exit",
    sections: ORDER.filter((id) => rows.has(id)).map((id) => ({
      id,
      title: text.summary.sections[id],
      rows: rows.get(id)!,
    })),
  };
}

/** The summary as lines for the PDF download. Same content as the screen, nothing added. */
export function summaryPdfLines(summary: TriageSummary, text: TriageText, createdOn: string): PdfLine[] {
  const t = text.summary;
  const lines: PdfLine[] = [
    { text: t.title, size: 20, bold: true },
    { text: t.intro, gapBefore: 4 },
    { text: t.generated(createdOn), size: 9 },
    { text: t.urgency, size: 13, bold: true, gapBefore: 14 },
    { text: `${summary.headline}: ${summary.timeframe}`, bold: true },
  ];
  if (summary.incomplete) lines.push({ text: t.incomplete });
  lines.push({ text: t.reasons, size: 13, bold: true, gapBefore: 10 });
  for (const reason of summary.reasons) lines.push({ text: `• ${reason}`, indent: 8 });
  for (const advice of summary.advice) lines.push({ text: `• ${advice}`, indent: 8 });
  for (const section of summary.sections) {
    lines.push({ text: section.title, size: 13, bold: true, gapBefore: 12 });
    for (const row of section.rows) lines.push({ text: `${row.label}: ${row.value}`, indent: 8 });
  }
  lines.push({ text: t.pdfDisclaimer, size: 9, gapBefore: 16 });
  return lines;
}
