"use client";

import { ListenButton } from "@/components/audio/listen-button";
import { Lock } from "@/components/ui/icons";
import { useUi } from "@/lib/hooks";
import { JourneyChoices } from "./journey-choices";

const HOME_SPEECH = [
  "ui.home.title",
  "ui.home.text",
  "ui.home.journeys.concern.title",
  "ui.home.journeys.noConcern.title",
  "ui.home.journeys.healthcare.title",
];

/** The start screen: a short privacy note, one question and the three ways in. */
export function HomeScreen() {
  const { ui } = useUi();
  const { home } = ui;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-4 py-1.5 text-base font-medium text-ink-soft shadow-soft">
          <Lock className="size-4 text-brand-700" />
          {home.privacy}
        </p>
        <h1 className="text-balance text-[clamp(1.875rem,1.3rem+2.4vw,3rem)] font-extrabold leading-tight tracking-tight">
          {home.title}
        </h1>
        <p className="max-w-[44ch] text-pretty text-lg leading-relaxed text-ink-soft">{home.text}</p>
        <ListenButton id="welcome" ids={HOME_SPEECH} readAlong />
      </div>

      <JourneyChoices />
    </div>
  );
}
