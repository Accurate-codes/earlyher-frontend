"use client";

import { useRouter } from "next/navigation";
import { ListenButton } from "@/components/audio/listen-button";
import { PageShell } from "@/components/layout/page-shell";
import { privacySpeech } from "@/lib/audio/page-speech";
import { TriageTopBar } from "@/components/triage/triage-flow";
import { useTriageText } from "@/lib/hooks";

/** Plain description of how answers are handled, linked from the consent screen. */
export function PrivacyView() {
  const router = useRouter();
  const { text, lang } = useTriageText();
  const t = text.privacy;
  return (
    <PageShell>
      <TriageTopBar onBack={() => router.back()} />
      <div className="flex flex-col gap-3">
        <h1 lang={lang} className="text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.6rem)] font-bold leading-[1.12] tracking-tight">
          {t.title}
        </h1>
        <p className="text-lg leading-relaxed text-ink-soft">{t.intro}</p>
        <ListenButton id="privacy" className="items-start" ids={privacySpeech(t.points.length)} />
      </div>
      <ul className="flex list-disc flex-col gap-3 rounded-3xl border border-line bg-white p-5 pl-10 text-lg leading-relaxed shadow-soft sm:p-7 sm:pl-12">
        {t.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="text-base text-ink-soft">{t.pending}</p>
    </PageShell>
  );
}
