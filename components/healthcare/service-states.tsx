"use client";

import { Card } from "@/components/layout/page-shell";
import { useShare } from "@/components/share/share-actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Printer } from "@/components/ui/icons";
import { Notice, ReviewBadge } from "@/components/ui/notice";
import { generalGuidance } from "@/content/en/clinical";
import { ui } from "@/content/en/ui";
import type { ServiceErrorKind } from "@/lib/types/api";

export function LoadingState({ label }: { label: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-3 py-10 text-lg font-semibold text-ink-soft">
      <span className="pulse-dot size-3 rounded-full bg-brand-500" aria-hidden="true" />
      {label}
    </p>
  );
}

/**
 * What a person sees when facility data cannot be shown: an honest message for the
 * specific reason, general guidance they can still act on, and other ways forward.
 */
export function FacilityDataProblem({ error, onRetry }: { error: ServiceErrorKind; onRetry?: () => void }) {
  const share = useShare({});
  const message =
    error === "offline" ? ui.healthcare.offline : error === "unavailable" ? ui.healthcare.unavailable : ui.healthcare.failure;

  return (
    <>
      <Notice tone="warning" role="alert">
        <p className="font-semibold">{message}</p>
      </Notice>

      <Card className="flex flex-col items-start gap-3">
        <h2 className="text-xl font-bold">{ui.healthcare.generalGuidanceTitle}</h2>
        <p className="text-lg leading-relaxed">{generalGuidance.text}</p>
        <p className="text-base leading-relaxed text-ink-soft">{ui.healthcare.unavailableHelp}</p>
        <ReviewBadge review={generalGuidance.review} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {onRetry && error !== "unavailable" && (
          <Button size="lg" onClick={onRetry} className="sm:col-span-2">
            {ui.common.tryAgain}
          </Button>
        )}
        <Button size="lg" variant="secondary" onClick={share.openPrint}>
          <Printer className="size-6" />
          {ui.common.print}
        </Button>
        <ButtonLink href="/learn" size="lg" variant="secondary">
          {ui.common.learnMore}
        </ButtonLink>
        <ButtonLink href="/concern" size="lg" variant="secondary">
          {ui.common.checkConcern}
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="secondary">
          {ui.common.home}
        </ButtonLink>
      </div>
      {share.dialogs}
    </>
  );
}
