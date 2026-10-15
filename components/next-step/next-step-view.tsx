"use client";

import { useEffect } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { SafetyMessage } from "@/components/clinical/safety-message";
import { Card, PageHeading, PageShell } from "@/components/layout/page-shell";
import { useSessionControls } from "@/components/session/session-provider";
import { useShare } from "@/components/share/share-actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { BookOpen, MapPin, Phone, Printer } from "@/components/ui/icons";
import { DemoBadge, Notice, ReviewBadge } from "@/components/ui/notice";
import { safetyMessage } from "@/content/en/clinical";
import { ui } from "@/content/en/ui";
import { getPathway } from "@/content/pathways";
import { useSession } from "@/lib/hooks";
import { explanationService } from "@/lib/services";
import { getReachedRecommendation, loadExplanation } from "@/lib/session/actions";
import { sessionStore, type ExplanationState } from "@/lib/session/session-store";

/**
 * Layer 2: optional AI-assisted wording. It sits under the approved explanation and
 * can only add text; every failure collapses to a short note and the journey goes on.
 */
function AssistedExplanation({ explanation }: { explanation: ExplanationState }) {
  if (explanation.status === "idle") return null;
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold">{ui.nextStep.aiLabel}</h3>
        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-800">
          {ui.nextStep.aiBadge}
        </span>
        {explanation.status === "ready" && explanation.simulated && <DemoBadge />}
      </div>

      {explanation.status === "loading" && (
        <p className="flex items-center gap-2 text-base text-ink-soft">
          <span className="pulse-dot size-2.5 rounded-full bg-brand-500" aria-hidden="true" />
          {ui.nextStep.aiLoading}
        </p>
      )}

      {explanation.status === "ready" && (
        <>
          <p className="text-base leading-relaxed">{explanation.text}</p>
          <p className="text-sm text-ink-soft">
            {explanation.simulated ? `${ui.nextStep.aiSimulated} ` : ""}
            {ui.nextStep.aiNote}
          </p>
        </>
      )}

      {explanation.status === "unavailable" && <p className="text-base text-ink-soft">{ui.nextStep.aiUnavailable}</p>}
    </div>
  );
}

export function NextStepView() {
  const session = useSession();
  const { requestFinish } = useSessionControls();
  const pathway = getPathway(session.pathwayId);
  // Layer 1: the recommendation comes from the pathway and the approved content only.
  const recommendation = getReachedRecommendation(pathway, session.answers);
  const share = useShare({ recommendation }, pathway?.version);

  const recommendationId = recommendation?.id;
  useEffect(() => {
    if (pathway && recommendationId) void loadExplanation(sessionStore, explanationService, pathway, recommendationId);
  }, [pathway, recommendationId]);

  if (!pathway || !recommendation) {
    return (
      <PageShell>
        <PageHeading title={ui.nextStep.noResult.title} lead={ui.nextStep.noResult.text} />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/concern" size="lg">
            {ui.common.checkConcern}
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="secondary">
            {ui.common.home}
          </ButtonLink>
        </div>
      </PageShell>
    );
  }

  const listenText = `${ui.nextStep.title}. ${recommendation.text} ${ui.nextStep.why} ${recommendation.why} ${safetyMessage.text}`;

  return (
    <PageShell>
      <PageHeading title={ui.nextStep.title}>
        <ListenButton id="next-step" text={listenText} audioKey={`recommendation.${recommendation.id}`} />
      </PageHeading>

      <Card className="flex flex-col items-start gap-3 border-brand-300 bg-gradient-to-b from-white to-brand-50">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold uppercase tracking-wide text-brand-700">{ui.nextStep.recommendation}</h2>
          <ReviewBadge review={recommendation.review} />
        </div>
        <p className="text-pretty text-[clamp(1.25rem,1.1rem+0.8vw,1.625rem)] font-bold leading-snug">{recommendation.text}</p>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{ui.nextStep.why}</h2>
          <p className="text-lg leading-relaxed">{recommendation.why}</p>
        </div>
        <AssistedExplanation explanation={session.explanation} />
      </Card>

      <SafetyMessage />

      <section aria-label={ui.nextStep.actions} className="grid gap-3 sm:grid-cols-2">
        <ButtonLink href="/healthcare" size="lg" className="sm:col-span-2">
          <MapPin className="size-6" />
          {ui.common.findHealthcare}
        </ButtonLink>
        <Button size="lg" variant="secondary" onClick={share.openPrint}>
          <Printer className="size-6" />
          {ui.common.print}
        </Button>
        <Button size="lg" variant="secondary" onClick={share.openSms}>
          <Phone className="size-6" />
          {ui.nextStep.sms}
        </Button>
        <ButtonLink href="/learn" size="lg" variant="secondary">
          <BookOpen className="size-6" />
          {ui.common.learnMore}
        </ButtonLink>
        <Button size="lg" variant="secondary" onClick={requestFinish}>
          {ui.common.finish}
        </Button>
      </section>

      {recommendation.review.status !== "approved" && <Notice tone="warning">{ui.nextStep.draftNote}</Notice>}

      {share.dialogs}
    </PageShell>
  );
}
