"use client";

import { useRouter } from "next/navigation";
import { ListenButton } from "@/components/audio/listen-button";
import { SafetyMessage } from "@/components/clinical/safety-message";
import { PageHeading, PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { concerns, safetyMessage } from "@/content/en/clinical";
import { devFixturePathwayId } from "@/content/pathways";
import { ui } from "@/content/en/ui";
import { chooseConcern } from "@/lib/session/actions";
import { sessionStore } from "@/lib/session/session-store";

export const optionButtonClass =
  "flex min-h-16 w-full items-center justify-between gap-3 rounded-3xl border border-line bg-white px-5 py-4 text-left text-lg font-semibold leading-snug shadow-soft transition-[border-color,background-color,transform] duration-150 hover:border-brand-400 hover:bg-brand-50 active:scale-[0.99]";

export function ConcernPicker() {
  const router = useRouter();

  const open = (concernId: (typeof concerns)[number]["id"] | null, pathwayId: string | null) => {
    chooseConcern(sessionStore, concernId, pathwayId);
    router.push("/assessment");
  };

  const listenText = `${ui.concern.listenIntro} ${concerns.map((c) => c.label).join(". ")}. ${safetyMessage.text}`;

  return (
    <PageShell>
      <PageHeading title={ui.concern.title} lead={ui.concern.help}>
        <ListenButton id="concern" text={listenText} audioKey="concern" />
      </PageHeading>

      <ul className="grid gap-3 sm:grid-cols-2">
        {concerns.map((concern) => (
          <li key={concern.id}>
            <button type="button" className={optionButtonClass} onClick={() => open(concern.id, concern.pathwayId)}>
              {concern.label}
              <ArrowRight className="size-5 shrink-0 text-brand-600" />
            </button>
          </li>
        ))}
        {devFixturePathwayId && (
          <li className="sm:col-span-2">
            <button
              type="button"
              className={`${optionButtonClass} border-dashed border-sky-300 bg-sky-50 text-sky-950 hover:border-sky-400 hover:bg-sky-100`}
              onClick={() => open(null, devFixturePathwayId)}
            >
              <span className="flex flex-col">
                {ui.concern.devFixture}
                <span className="text-sm font-normal">{ui.concern.devFixtureHelp}</span>
              </span>
              <ArrowRight className="size-5 shrink-0" />
            </button>
          </li>
        )}
      </ul>

      <SafetyMessage />

      <div>
        <ButtonLink href="/" variant="secondary">
          <ArrowLeft className="size-5" />
          {ui.common.back}
        </ButtonLink>
      </div>
    </PageShell>
  );
}
