"use client";

import { entryRoute } from "@/components/triage/triage-flow";
import { ButtonLink } from "@/components/ui/button";
import { useSession, useTriageText } from "@/lib/hooks";
import { buildPath, resolveCursor } from "@/lib/triage/flow";
import { evaluate } from "@/lib/triage/rules";

/**
 * Links the finder back to the person's guidance. It reads the in-memory session only:
 * no answer or result is put in the URL. Facilities are never described as able to
 * meet the timeframe, because the data says nothing about availability.
 */
export function AssessmentContext() {
  const { triage } = useSession();
  const { text } = useTriageText();
  if (!triage?.consent) return null;
  const t = text.finderContext;
  const path = buildPath(triage);
  const cursor = resolveCursor(triage, path);

  if (cursor !== "result") {
    if (cursor === "welcome") return null;
    return (
      <div>
        <ButtonLink href={entryRoute(triage.entry)} variant="secondary">
          {t.backToQuestions}
        </ButtonLink>
      </div>
    );
  }

  const evaluation = evaluate(path.answers);
  const outcome = text.results.outcomes[evaluation.outcome];
  return (
    <section
      aria-labelledby="assessment-context"
      className={`flex flex-col gap-2 rounded-3xl border-2 p-4 sm:p-5 ${
        evaluation.outcome === "red" ? "border-red-300 bg-red-50" : "border-line bg-white"
      }`}
    >
      <h2 id="assessment-context" className="text-sm font-bold uppercase tracking-wide text-ink-soft">
        {t.heading}
      </h2>
      <p className="text-lg font-bold">
        {outcome.headline} <span className="font-semibold text-ink-soft">({outcome.timeframe})</span>
      </p>
      {evaluation.outcome === "red" && <p className="text-base font-semibold text-red-950">{t.redNote}</p>}
      {evaluation.outcome !== "green" && <p className="text-base leading-relaxed">{t.windowNote}</p>}
      <div>
        <ButtonLink href="/next-step" variant="secondary">
          {t.backToResult}
        </ButtonLink>
      </div>
    </section>
  );
}
