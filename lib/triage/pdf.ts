/**
 * A small text-only PDF writer for the doctor summary, so the download works offline
 * without a third-party library. It uses the standard Helvetica fonts with WinAnsi
 * encoding: characters outside that set (for example some Yoruba letters with dots
 * below) are written without their marks. See README "Doctor summary".
 */

export interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  /** Extra space above the line, in points. */
  gapBefore?: number;
  /** Indent from the left margin, in points. */
  indent?: number;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;

// Helvetica advance widths (per 1000 units) for ASCII 32–126, from the standard font metrics.
const WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556,
  556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const WIN_ANSI_EXTRAS: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
};

/** Maps text to WinAnsi bytes. Unsupported letters lose their accent marks; anything else becomes "?". */
export function toWinAnsi(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if ((code >= 32 && code <= 126) || (code >= 0xa0 && code <= 0xff)) bytes.push(code);
    else if (WIN_ANSI_EXTRAS[char] !== undefined) bytes.push(WIN_ANSI_EXTRAS[char]);
    else {
      const stripped = char.normalize("NFD").replace(/[̀-ͯ]/g, "");
      const base = stripped.codePointAt(0) ?? 63;
      bytes.push(stripped.length > 0 && ((base >= 32 && base <= 126) || (base >= 0xa0 && base <= 0xff)) ? base : 63);
    }
  }
  return bytes;
}

function textWidth(bytes: number[], size: number, bold: boolean): number {
  const units = bytes.reduce((sum, byte) => sum + (byte >= 32 && byte <= 126 ? WIDTHS[byte - 32] : 556), 0);
  // Bold glyphs are slightly wider; a margin keeps wrapped lines inside the page.
  return (units * size * (bold ? 1.08 : 1.02)) / 1000;
}

/** Splits text into lines that fit the given width. */
export function wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(toWinAnsi(candidate), size, bold) <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

const hex = (bytes: number[]) => bytes.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

/** Lays out the lines over as many A4 pages as needed and returns the PDF file bytes. */
export function createTextPdf(title: string, input: PdfLine[]): Uint8Array<ArrayBuffer> {
  const pages: string[][] = [[]];
  let y = PAGE_HEIGHT - MARGIN;
  for (const item of input) {
    const size = item.size ?? 11;
    const bold = item.bold ?? false;
    const indent = item.indent ?? 0;
    const leading = size * 1.35;
    y -= item.gapBefore ?? 0;
    for (const line of wrap(item.text, size, bold, PAGE_WIDTH - 2 * MARGIN - indent)) {
      if (y - leading < MARGIN) {
        pages.push([]);
        y = PAGE_HEIGHT - MARGIN;
      }
      y -= leading;
      pages[pages.length - 1].push(
        `BT /${bold ? "F2" : "F1"} ${size} Tf ${(MARGIN + indent).toFixed(2)} ${y.toFixed(2)} Td <${hex(toWinAnsi(line))}> Tj ET`,
      );
    }
  }

  // Objects: 1 catalog, 2 page tree, 3–4 fonts, 5 info, then a page and its content per page.
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 6 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  objects[5] = `<< /Title <${hex([0xfe, 0xff, ...[...title].flatMap((c) => {
    const code = c.charCodeAt(0);
    return [code >> 8, code & 0xff];
  })])}> /Producer (EarlyHer) >>`;
  pages.forEach((commands, index) => {
    const stream = commands.join("\n");
    objects[pageIds[index]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageIds[index] + 1} 0 R >>`;
    objects[pageIds[index] + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  // Every character written is ASCII, so string length equals byte length for the offsets.
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = body.length;
    body += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = body.length;
  body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) body += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}
