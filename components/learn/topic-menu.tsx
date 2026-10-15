"use client";

import Link from "next/link";
import { ListenButton } from "@/components/audio/listen-button";
import { PageHeading, PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { ReviewBadge } from "@/components/ui/notice";
import { educationIntro, educationModules } from "@/content/en/education";
import { ui } from "@/content/en/ui";
import { useSession } from "@/lib/hooks";
import { ModuleIcon } from "./module-icon";

export function TopicMenu() {
  const { arrivedWithoutConcern } = useSession();
  const greeting = arrivedWithoutConcern ? educationIntro.greeting : undefined;
  const listenText = `${greeting ?? ""} ${educationIntro.prompt} ${educationModules.map((m) => m.title).join(". ")}.`;

  return (
    <PageShell>
      <PageHeading title={educationIntro.prompt} eyebrow={greeting}>
        <ListenButton id="learn-menu" text={listenText} audioKey="learn.menu" />
      </PageHeading>

      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {educationModules.map((module) => (
          <li key={module.slug} className="flex">
            <Link
              href={`/learn/${module.slug}`}
              className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-white p-4 shadow-soft transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift sm:p-5"
            >
              <ModuleIcon icon={module.icon} />
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="text-xl font-bold leading-snug tracking-tight">{module.title}</span>
                <span className="text-base leading-snug text-ink-soft">{module.summary}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                  {ui.learn.moduleCount(module.cards.length)}
                  <ReviewBadge review={module.review} />
                </span>
              </span>
              <ArrowRight className="size-6 shrink-0 text-brand-600 transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/" variant="secondary">
          <ArrowLeft className="size-5" />
          {ui.common.back}
        </ButtonLink>
        <ButtonLink href="/concern" variant="secondary">
          {ui.common.checkConcern}
        </ButtonLink>
        <ButtonLink href="/healthcare" variant="secondary">
          {ui.common.findHealthcare}
        </ButtonLink>
      </div>
    </PageShell>
  );
}
