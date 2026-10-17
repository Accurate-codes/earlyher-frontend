"use client";

import { useRouter } from "next/navigation";
import { CareOptions } from "@/components/clinical/care-options";
import { SafetyMessage } from "@/components/clinical/safety-message";
import { FlowNav } from "@/components/layout/flow-nav";
import { Card, PageHeading, PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { getQuestionnaire } from "@/content/questionnaires";
import { useSession, useUi } from "@/lib/hooks";
import { localize } from "@/lib/i18n/translate";
import { evaluateUrgency } from "@/lib/questionnaire/engine";
import { sessionStore } from "@/lib/session/session-store";
import type { UrgencyLevel } from "@/lib/types/questionnaire";

const tones: Record<UrgencyLevel["tone"], string> = {
  urgent: "border-red-300 bg-red-50",
  soon: "border-amber-300 bg-amber-50",
  routine: "border-brand-300 bg-brand-50",
};

/**
 * Next steps after the questionnaire. How soon to seek care comes only from the
 * clinical lead's approved rules; until they exist the screen says so and still
 * offers both ways to reach a professional.
 */
export function ResultsView() {
  const router = useRouter();
  const session = useSession();
  const { ui, locale } = useUi();
  const t = ui.results;
  const questionnaire = getQuestionnaire(session.questionnaireId);

  if (!questionnaire || !session.submitted) {
    return (
      <PageShell>
        <FlowNav />
        <PageHeading title={t.noResult.title} lead={t.noResult.text} />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/concern" size="lg">
            {ui.common.checkConcern}
          </ButtonLink>
          <ButtonLink href="/healthcare" size="lg" variant="secondary">
            {ui.common.findHealthcare}
          </ButtonLink>
        </div>
      </PageShell>
    );
  }

  const outcome = evaluateUrgency(questionnaire, session.answers);
  const level =
    outcome.status === "level"
      ? {
          tone: outcome.level.tone,
          title: localize(outcome.level.title, locale, questionnaire.translations),
          description: localize(outcome.level.description, locale, questionnaire.translations),
        }
      : null;

  return (
    <PageShell>
      <FlowNav
        back={{
          onClick: () => {
            sessionStore.update({ step: { review: true } });
            router.push("/concern");
          },
        }}
        backLabel={t.backToAnswers}
      />
      <PageHeading title={t.title} />

      <section aria-labelledby="urgency-heading">
        {level ? (
          <Card className={`flex flex-col items-start gap-2 ${tones[level.tone]}`}>
            <h2 id="urgency-heading" className="text-base font-bold uppercase tracking-wide text-ink-soft">
              {t.urgencyHeading}
            </h2>
            <p lang={level.title.lang} className="text-pretty text-[clamp(1.25rem,1.1rem+0.8vw,1.625rem)] font-bold leading-snug">
              {level.title.text}
            </p>
            <p lang={level.description.lang} className="text-lg leading-relaxed">
              {level.description.text}
            </p>
            {questionnaire.developmentFixture && <Notice tone="demo">{t.fixtureResult}</Notice>}
          </Card>
        ) : (
          <Card className="flex flex-col items-start gap-2">
            <h2 id="urgency-heading" className="text-xl font-bold">
              {t.urgencyHeading}
            </h2>
            <p className="text-lg leading-relaxed">{t.urgencyPending}</p>
            <p className="text-base leading-relaxed text-ink-soft">{t.urgencyPendingNext}</p>
          </Card>
        )}
      </section>

      <section aria-labelledby="care-heading" className="flex flex-col gap-3">
        <h2 id="care-heading" className="text-xl font-bold">
          {t.optionsHeading}
        </h2>
        <CareOptions headingLevel={3} />
      </section>

      <SafetyMessage />
    </PageShell>
  );
}
