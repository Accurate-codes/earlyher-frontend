"use client";

import { useState } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { Card, PageHeading, PageShell } from "@/components/layout/page-shell";
import { useSessionControls } from "@/components/session/session-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "@/components/ui/icons";
import { ReviewBadge } from "@/components/ui/notice";
import { educationModules } from "@/content/en/education";
import { ui } from "@/content/en/ui";
import type { EducationCard, EducationModule } from "@/lib/types/clinical";
import { ModuleIcon } from "./module-icon";

function cardSpeech(card: EducationCard): string {
  return [card.heading, card.body, card.points?.join(". "), card.callout].filter(Boolean).join(". ");
}

function Completion({ module, onReview }: { module: EducationModule; onReview: () => void }) {
  const { requestFinish } = useSessionControls();
  const position = educationModules.findIndex((item) => item.slug === module.slug);
  const next = educationModules[position + 1];

  return (
    <PageShell>
      <PageHeading title={ui.learn.complete.title} lead={ui.learn.complete.text} eyebrow={module.title}>
        <ListenButton id={`learn-done-${module.slug}`} text={`${ui.learn.complete.title}. ${ui.learn.complete.text}`} />
      </PageHeading>

      <div className="grid gap-3 sm:grid-cols-2">
        <ButtonLink href={next ? `/learn/${next.slug}` : "/learn"} size="lg" className="sm:col-span-2">
          <span className="flex flex-col">
            {ui.common.learnMore}
            {next && <span className="text-sm font-normal text-white/90">{next.title}</span>}
          </span>
          <ArrowRight className="size-6" />
        </ButtonLink>
        <ButtonLink href="/concern" size="lg" variant="secondary">
          {ui.common.checkConcern}
        </ButtonLink>
        <ButtonLink href="/healthcare" size="lg" variant="secondary">
          {ui.common.findHealthcare}
        </ButtonLink>
        <ButtonLink href="/learn" size="lg" variant="secondary">
          {ui.learn.allTopics}
        </ButtonLink>
        <Button size="lg" variant="secondary" onClick={requestFinish}>
          {ui.common.finish}
        </Button>
      </div>

      <div>
        <Button variant="quiet" onClick={onReview}>
          <ArrowLeft className="size-5" />
          {ui.common.back}
        </Button>
      </div>
    </PageShell>
  );
}

/** One short card at a time, with Listen, Back and Next. */
export function ModuleViewer({ module }: { module: EducationModule }) {
  const [index, setIndex] = useState(0);
  const total = module.cards.length;

  if (index >= total) return <Completion module={module} onReview={() => setIndex(total - 1)} />;

  const card = module.cards[index];

  return (
    <PageShell>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="flex flex-wrap items-center justify-center gap-2 text-base font-semibold text-brand-700">
          {module.title}
          <ReviewBadge review={module.review} />
        </p>
        <p className="text-sm text-ink-soft">{ui.learn.cardOf(index + 1, total)}</p>
        <div className="flex gap-1.5" aria-hidden="true">
          {module.cards.map((item, position) => (
            <span key={item.id} className={`h-1.5 w-8 rounded-full ${position <= index ? "bg-brand-600" : "bg-brand-200"}`} />
          ))}
        </div>
      </div>

      <Card key={card.id} className="rise-in flex flex-col items-center gap-5 text-center sm:p-10">
        <ModuleIcon icon={module.icon} large />
        <h1 className="max-w-[22ch] text-balance text-[clamp(1.625rem,1.2rem+2vw,2.375rem)] font-bold leading-tight tracking-tight">
          {card.heading}
        </h1>
        {card.body && <p className="max-w-[40ch] text-pretty text-xl leading-relaxed">{card.body}</p>}
        {card.points && (
          <ul className="flex w-full max-w-md flex-col gap-2.5 text-left text-lg leading-snug">
            {card.points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <Check className="size-4" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        )}
        {card.callout && (
          <p className="max-w-[40ch] rounded-2xl bg-brand-50 px-5 py-4 text-lg font-semibold leading-relaxed text-brand-800">
            {card.callout}
          </p>
        )}
        <ListenButton id={`learn-${module.slug}-${card.id}`} text={cardSpeech(card)} audioKey={card.audioKey} />

        {card.askAboutChanges && (
          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            <ButtonLink href="/concern" size="lg">
              {ui.learn.yes}
            </ButtonLink>
            <Button size="lg" variant="secondary" onClick={() => setIndex(index + 1)}>
              {ui.learn.no}
            </Button>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        {index > 0 ? (
          <Button size="lg" variant="secondary" onClick={() => setIndex(index - 1)}>
            <ArrowLeft className="size-5" />
            {ui.common.back}
          </Button>
        ) : (
          <ButtonLink href="/learn" size="lg" variant="secondary">
            <ArrowLeft className="size-5" />
            {ui.common.back}
          </ButtonLink>
        )}
        {!card.askAboutChanges && (
          <Button size="lg" onClick={() => setIndex(index + 1)}>
            {ui.common.next}
            <ArrowRight className="size-5" />
          </Button>
        )}
      </div>
    </PageShell>
  );
}
