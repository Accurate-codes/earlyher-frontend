"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { PageShell } from "@/components/layout/page-shell";
import { NoResult, OUTCOME_STYLE, useTriageResult } from "@/components/results/results-view";
import { GuidanceFooter } from "@/components/triage/care-actions";
import { TriageTopBar } from "@/components/triage/triage-flow";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { summarySpeech } from "@/lib/audio/page-speech";
import { downloadFile } from "@/lib/download";
import { triageText } from "@/content/en/triage";
import { useTriageText } from "@/lib/hooks";
import { createTextPdf } from "@/lib/triage/pdf";
import { buildSummary, summaryPdfLines } from "@/lib/triage/summary";

const noSubscription = () => () => {};

/** True where the browser can share a file through the device's own share sheet. */
function canShareFiles(): boolean {
  try {
    const probe = new File([""], "probe.pdf", { type: "application/pdf" });
    return typeof navigator.share === "function" && navigator.canShare?.({ files: [probe] }) === true;
  } catch {
    return false;
  }
}

/**
 * The doctor summary: what the person told us, the guidance and why. Downloading or
 * sharing happens only when the person presses the button; nothing is uploaded.
 */
export function SummaryView() {
  const router = useRouter();
  const result = useTriageResult();
  const { text, lang } = useTriageText();
  const shareSupported = useSyncExternalStore(noSubscription, canShareFiles, () => false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!result) return <NoResult />;

  const t = text.summary;
  const summary = buildSummary(result.path, result.evaluation, text);
  const style = OUTCOME_STYLE[summary.outcome];

  // The PDF is always in English: its built-in font cannot show Yoruba tone marks, and the
  // screen says so while Yoruba is selected. Same answers, same result, English wording.
  const pdf = () => {
    const createdOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const english = buildSummary(result.path, result.evaluation, triageText);
    return createTextPdf(triageText.summary.pdfTitle, summaryPdfLines(english, triageText, createdOn));
  };

  const download = () => {
    setProblem(null);
    try {
      if (!downloadFile(t.fileName, pdf(), "application/pdf")) setProblem(t.downloadFailed);
    } catch {
      setProblem(t.downloadFailed);
    }
  };

  const share = async () => {
    setProblem(null);
    try {
      const file = new File([pdf()], t.fileName, { type: "application/pdf" });
      await navigator.share({ files: [file], title: t.pdfTitle });
    } catch (error) {
      // Closing the share sheet is a choice, not a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) setProblem(t.shareFailed);
    }
  };

  return (
    <PageShell>
      <TriageTopBar onBack={() => router.push("/next-step")} backLabel={t.backToResult} />
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.75rem)] font-bold leading-[1.12] tracking-tight">{t.title}</h1>
        <p className="max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-soft">{t.intro}</p>
        <ListenButton id={`summary-${summary.outcome}`} ids={summarySpeech(result.evaluation, summary.incomplete)} />
      </div>

      <section aria-labelledby="summary-guidance" className={`flex flex-col gap-2 rounded-3xl border-2 p-5 sm:p-6 ${style.card}`}>
        <h2 id="summary-guidance" className="text-base font-bold uppercase tracking-wide text-ink-soft">
          {t.urgency}
        </h2>
        <p className="text-2xl font-bold leading-snug">{summary.headline}</p>
        <p className="text-lg font-semibold">{summary.timeframe}</p>
        {summary.incomplete && <p className="text-base leading-relaxed">{t.incomplete}</p>}
        <h3 className="mt-2 text-base font-bold">{t.reasons}</h3>
        <ul className="flex list-disc flex-col gap-1 pl-6 text-base leading-relaxed">
          {[...summary.reasons, ...summary.advice].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {summary.sections.map((section) => (
        <section key={section.id} aria-labelledby={`section-${section.id}`} className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
          <h2 id={`section-${section.id}`} className="mb-2 text-xl font-bold">
            {section.title}
          </h2>
          <dl className="flex flex-col divide-y divide-line">
            {section.rows.map((row) => (
              <div key={row.question} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
                <dt className="shrink-0 text-base font-semibold text-ink-soft sm:w-56">{row.label}</dt>
                <dd className={`min-w-0 text-base leading-snug ${row.notAsked ? "italic text-ink-soft" : ""}`}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button size="lg" onClick={download}>
          {t.download}
        </Button>
        {shareSupported && (
          <Button size="lg" variant="secondary" onClick={share}>
            {t.share}
          </Button>
        )}
        <ButtonLink href="/next-step" size="lg" variant="secondary">
          {t.backToResult}
        </ButtonLink>
      </div>
      {lang !== "en" && <p className="text-sm text-ink-soft">{t.pdfInEnglish}</p>}
      {shareSupported && <p className="text-sm text-ink-soft">{t.shareNote}</p>}
      {problem && (
        <Notice tone="warning" role="alert">
          {problem}
        </Notice>
      )}
      <GuidanceFooter showSave={false} />
    </PageShell>
  );
}
