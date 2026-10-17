"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSessionControls } from "@/components/session/session-provider";
import { Info } from "@/components/ui/icons";
import { useSession, useUi } from "@/lib/hooks";
import { localeStore } from "@/lib/i18n/locale-store";
import { LOCALES } from "@/lib/i18n/translate";
import { sessionStore } from "@/lib/session/session-store";

/** English / Yorùbá switch. Each language is named in its own language. */
function LanguageSelector() {
  const { ui, locale, fallback } = useUi();

  // Only mark the page as Yoruba once its text actually is; English text keeps lang="en".
  useEffect(() => {
    document.documentElement.lang = locale === "yo" && !fallback ? "yo" : "en";
  }, [locale, fallback]);

  return (
    <div role="group" aria-label={ui.language.label} className="flex rounded-full border border-line bg-white p-1 shadow-soft">
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            onClick={() => localeStore.set(code)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-base font-semibold transition-colors ${
              active ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-brand-50 hover:text-ink"
            }`}
          >
            {ui.language.names[code]}
          </button>
        );
      })}
    </div>
  );
}

/** Says plainly that untranslated text is in English while Yoruba is selected. */
function TranslationNotice() {
  const { ui, locale, fallback } = useUi();
  if (locale !== "yo" || !fallback) return null;
  return (
    <div role="status" className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <p lang="en" className="mx-auto flex w-full max-w-6xl items-start gap-2 px-4 py-2 text-base sm:px-6">
        <Info className="mt-0.5 size-5 shrink-0" />
        {ui.language.pending}
      </p>
    </div>
  );
}

function HeaderContent({ pathname }: { pathname: string | null }) {
  const { requestFinish } = useSessionControls();
  const { ui } = useUi();
  useSession();
  // Finish is offered once there is something to clear or the person has left the start screen.
  const canFinish = sessionStore.hasData() || (pathname !== null && pathname !== "/");

  return (
    <header className="relative z-20 border-b border-line/70 bg-canvas/85 backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label={`${ui.appName} — ${ui.common.home}`} className="shrink-0 rounded-full">
          <Image
            src="/brand/earlyher-logo.png"
            alt={ui.logoAlt}
            width={56}
            height={56}
            priority
            // Served as the precached file so the logo also shows offline.
            unoptimized
            className="size-12 sm:size-14"
          />
        </Link>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <LanguageSelector />
          {canFinish && (
            <button
              type="button"
              onClick={requestFinish}
              className="inline-flex min-h-12 items-center rounded-full bg-ink px-5 text-base font-semibold text-white shadow-soft hover:bg-brand-800"
            >
              {ui.common.finish}
            </button>
          )}
        </div>
      </div>
      <TranslationNotice />
    </header>
  );
}

function HeaderWithPathname() {
  return <HeaderContent pathname={usePathname()} />;
}

export function AppHeader() {
  return (
    <Suspense fallback={<HeaderContent pathname={null} />}>
      <HeaderWithPathname />
    </Suspense>
  );
}
