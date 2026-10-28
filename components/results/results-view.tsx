"use client";

import { ListenButton } from "@/components/audio/listen-button";
import { NO_RESULT_SPEECH, resultSpeech } from "@/lib/audio/page-speech";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CareOptions } from "@/components/clinical/care-options";
import { SafetyMessage } from "@/components/clinical/safety-message";
import { PageShell } from "@/components/layout/page-shell";
import { EmergencyLine, GuidanceFooter, ReminderButton, SelfCheckGuideButton, TelemedicineLink } from "@/components/triage/care-actions";
import { entryRoute, TriageTopBar } from "@/components/triage/triage-flow";
import { Button, ButtonLink } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";
import { appConfig } from "@/lib/config";
import { useSession, useTriageText, useUi } from "@/lib/hooks";
import { explanationService } from "@/lib/services";
import { commitTriage } from "@/lib/session/actions";
import { sessionStore } from "@/lib/session/session-store";
import { buildPath, continueAfterRed, goBack, resolveCursor, type Path, type TriageState } from "@/lib/triage/flow";
import { evaluate, type Evaluation, type Outcome } from "@/lib/triage/rules";

/** Colour supports the label and timeframe; it never carries the meaning alone. */
export const OUTCOME_STYLE: Record<Outcome, { card: string; chip: string }> = {
  red: { card: "border-red-300 bg-red-50", chip: "bg-red-700 text-white" },
  orange: { card: "border-orange-300 bg-orange-50", chip: "bg-orange-700 text-white" },
  yellow: { card: "border-amber-300 bg-amber-50", chip: "bg-amber-200 text-amber-950" },
  green: { card: "border-emerald-300 bg-emerald-50", chip: "bg-emerald-700 text-white" },
  review: { card: "border-brand-300 bg-brand-50", chip: "bg-brand-700 text-white" },
};

const MAX_REASONS = 4;

/** The finished assessment, if the person has reached a result. */
export function useTriageResult(): { triage: TriageState; path: Path; evaluation: Evaluation } | null {
  const { triage } = useSession();
  if (!triage) return null;
  const path = buildPath(triage);
  if (resolveCursor(triage, path) !== "result") return null;
  return { triage, path, evaluation: evaluate(path.answers) };
}

export function NoResult() {
  const { ui } = useUi();
  const { text } = useTriageText();
  return (
    <PageShell>
      <TriageTopBar />
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.75rem)] font-bold leading-[1.12] tracking-tight">
          {text.results.noResult.title}
        </h1>
        <p className="max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-soft">{text.results.noResult.text}</p>
        <ListenButton id="no-result" ids={NO_RESULT_SPEECH} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/concern" size="lg">
          {text.results.concern}
        </ButtonLink>
        <ButtonLink href="/healthcare" size="lg" variant="secondary">
          {ui.common.findHealthcare}
        </ButtonLink>
      </div>
    </PageShell>
  );
}

type ExplanationState = {
  key: string;
  status: "ready" | "error";
  explanation: string;
  errorKind?: string;
};

function AiExplanationCard({
  outcome,
  entry,
  lang,
}: {
  outcome: Outcome;
  entry: string;
  lang: string;
}) {
  const requestKey = `${outcome}:${entry}:${lang}`;
  const [resultState, setResultState] = useState<ExplanationState | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    explanationService
      .explain(
        {
          recommendationId: outcome,
          pathwayId: entry,
          pathwayVersion: "1.0",
          questionBankVersion: "1.0",
          locale: lang,
        },
        controller.signal
      )
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.ok) {
          setResultState({
            key: requestKey,
            status: "ready",
            explanation: res.data.explanation,
          });
        } else {
          setResultState({
            key: requestKey,
            status: "error",
            explanation: "",
            errorKind: res.error,
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResultState({
            key: requestKey,
            status: "error",
            explanation: "",
            errorKind: "network-error",
          });
        }
      });

    return () => controller.abort();
  }, [outcome, entry, lang, requestKey]);

  const isLoading = !resultState || resultState.key !== requestKey;
  const isError = !isLoading && resultState.status === "error";

  // In production, hide cleanly on error per PRD Section 31.
  // In local dev, show a helpful diagnostic message so you know why it failed!
  if (isError && process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <section
      aria-labelledby="ai-explanation-heading"
      className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ai-explanation-heading" className="text-lg font-bold">
          {lang === "yo" ? "Àlàyé síwájú sí i" : "More explanation"}
        </h2>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {lang === "yo" ? "ÌRÀNLỌ́WỌ́ AI (N-ATLaS)" : "AI-ASSISTED (N-ATLaS)"}
        </span>
      </div>
      {isLoading ? (
        <p className="text-base italic text-ink-soft">
          {lang === "yo"
            ? "Ẹ jọ̀wọ́ ẹ mú sùúrù, a ń pese àlàyé rọrùn fún yín..."
            : "Generating a simple, personalized explanation for your next step..."}
        </p>
      ) : isError ? (
        <p className="text-sm text-amber-800">
          Dev note: AI service returned <strong>{resultState.errorKind}</strong> (mode:{" "}
          <code>{appConfig.apiMode}</code>, base URL:{" "}
          <code>{appConfig.apiBaseUrl || "empty — restart Next.js to load .env.local"}</code>).
        </p>
      ) : (
        <p lang={lang} className="text-lg leading-relaxed">
          {resultState.explanation}
        </p>
      )}
    </section>
  );
}

function Actions({ evaluation }: { evaluation: Evaluation }) {
  const { text } = useTriageText();
  const a = text.results.actions;
  const items: ReactNode[] = [];
  const link = (href: string, label: string, primary = false) => (
    <ButtonLink key={label} href={href} size="lg" variant={primary ? "primary" : "secondary"} className="w-full sm:w-auto">
      {label}
    </ButtonLink>
  );

  switch (evaluation.outcome) {
    case "red":
      items.push(link("/healthcare", a.findCareNow, true), <TelemedicineLink key="talk" label={a.talkNow} />);
      break;
    case "orange":
      items.push(link("/healthcare", a.findFacility, true), <TelemedicineLink key="talk" label={a.talkDoctor} />, link("/summary", a.summary));
      break;
    case "yellow":
      items.push(link("/healthcare", a.findCare, true), <ReminderButton key="recheck" kind="recheck" label={a.recheckReminder} />);
      break;
    case "review":
      items.push(link("/healthcare", a.findCare, true), <TelemedicineLink key="talk" label={a.talkDoctor} />, link("/summary", a.viewSummary));
      break;
    case "green": {
      const routine = link("/healthcare", a.routineCare, evaluation.advice.includes("routineCheck") || evaluation.advice.includes("screening"));
      const reminder = <ReminderButton key="monthly" kind="monthly" label={a.monthlyReminder} />;
      const guide = <SelfCheckGuideButton key="guide" label={a.selfCheckGuide} />;
      const learn = link("/learn", a.learn);
      if (evaluation.advice.includes("routineCheck") || evaluation.advice.includes("screening")) items.push(routine, reminder, guide, learn);
      else if (evaluation.advice.includes("monthlySelfCheck")) items.push(reminder, guide, learn, routine);
      else items.push(guide, learn, reminder, routine);
      break;
    }
  }
  return <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{items}</div>;
}

export function ResultsView() {
  const router = useRouter();
  const result = useTriageResult();
  const { text, lang } = useTriageText();
  if (!result) return <NoResult />;

  const { triage, path, evaluation } = result;
  const t = text.results;
  const outcome = t.outcomes[evaluation.outcome];
  const style = OUTCOME_STYLE[evaluation.outcome];
  const reasons = evaluation.reasons.slice(0, MAX_REASONS);
  const hidden = evaluation.reasons.length - reasons.length;
  const incomplete = path.end === "red-exit";

  const backToAnswers = () => {
    commitTriage(sessionStore, goBack(triage));
    router.push(entryRoute(triage.entry));
  };

  return (
    <PageShell>
      <TriageTopBar onBack={backToAnswers} backLabel={t.backToAnswers} />

      <section aria-labelledby="result-headline" className={`rise-in flex flex-col items-start gap-3 rounded-4xl border-2 p-5 shadow-soft sm:p-7 ${style.card}`}>
        <p className="text-base font-bold uppercase tracking-wide text-ink-soft">{t.howSoon}</p>
        <p className={`inline-flex flex-wrap items-center gap-x-2 rounded-full px-4 py-1.5 text-base font-bold ${style.chip}`}>
          <span>{outcome.label}</span>
          <span aria-hidden="true">·</span>
          <span>{outcome.timeframe}</span>
        </p>
        <h1 id="result-headline" lang={lang} className="text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.6rem)] font-bold leading-[1.12] tracking-tight">
          {outcome.headline}
        </h1>
        <p lang={lang} className="text-lg leading-relaxed">
          {outcome.body}
        </p>
        <ListenButton
          id={`result-${evaluation.outcome}`}
          className="items-start"
          readAlong
          ids={resultSpeech(evaluation, reasons, incomplete, t.bring.length)}
        />
        {evaluation.outcome === "red" && (
          <div className="w-full rounded-2xl bg-white/70 px-4 py-3 text-base font-semibold">
            <EmergencyLine />
          </div>
        )}
      </section>

      <AiExplanationCard outcome={evaluation.outcome} entry={triage.entry} lang={lang} />

      <section aria-labelledby="next-heading" className="flex flex-col gap-3">
        <h2 id="next-heading" className="text-xl font-bold">
          {t.nextHeading}
        </h2>
        <Actions evaluation={evaluation} />
        {evaluation.advice.length > 0 && (
          <ul className="flex flex-col gap-2">
            {evaluation.advice.map((key) => (
              <li key={key} className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-base leading-relaxed">
                <Check className="mt-0.5 size-5 shrink-0 text-brand-700" />
                {t.advice[key]}
              </li>
            ))}
          </ul>
        )}
        {(evaluation.outcome === "yellow" || evaluation.outcome === "green") && <p className="text-sm text-ink-soft">{t.reminderNote}</p>}
      </section>

      {incomplete && (
        <section aria-labelledby="incomplete-heading" className="flex flex-col items-start gap-3 rounded-3xl border border-line bg-white p-5 shadow-soft">
          <h2 id="incomplete-heading" className="text-lg font-bold">
            {t.incompleteTitle}
          </h2>
          <p className="text-base leading-relaxed">{t.incompleteText}</p>
          <Button
            variant="secondary"
            onClick={() => {
              commitTriage(sessionStore, continueAfterRed(triage));
              router.push(entryRoute(triage.entry));
            }}
          >
            {t.continueQuestions}
          </Button>
        </section>
      )}

      <section aria-labelledby="reasons-heading" className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
        <h2 id="reasons-heading" className="text-xl font-bold">
          {t.reasonsHeading}
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-lg leading-relaxed">
          {reasons.map((key) => (
            <li key={key} lang={lang}>
              {t.reasons[key]}
            </li>
          ))}
        </ul>
        {hidden > 0 && <p className="text-base text-ink-soft">{t.moreReasons(hidden)}</p>}
        <ButtonLink href="/summary" variant="quiet" className="self-start">
          {t.actions.viewSummary}
        </ButtonLink>
      </section>

      <section aria-labelledby="care-heading" className="flex flex-col gap-3">
        <h2 id="care-heading" className="text-xl font-bold">
          {t.careHeading}
        </h2>
        <CareOptions headingLevel={3} facilityFirst={evaluation.outcome === "red"} />
      </section>

      {evaluation.outcome !== "green" && (
        <section aria-labelledby="bring-heading" className="flex flex-col gap-2 rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
          <h2 id="bring-heading" className="text-xl font-bold">
            {t.bringHeading}
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-6 text-lg leading-relaxed">
            {t.bring.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <SafetyMessage />
      <GuidanceFooter />
    </PageShell>
  );
}
