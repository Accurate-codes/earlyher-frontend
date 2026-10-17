"use client";

import { FlowNav } from "@/components/layout/flow-nav";
import { PageHeading, PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { useUi } from "@/lib/hooks";

/**
 * "I don't have a concern". Its content is to be supplied by the clinical lead; until
 * then the screen says so rather than inventing guidance.
 */
export function NoConcernView() {
  const { ui } = useUi();
  const t = ui.noConcern;
  return (
    <PageShell>
      <FlowNav back={{ href: "/" }} />
      <PageHeading eyebrow={t.title} title={t.pendingTitle} lead={t.pendingText} />
      <section aria-labelledby="no-concern-options" className="flex flex-col items-center gap-3">
        <h2 id="no-concern-options" className="text-lg font-semibold text-ink-soft">
          {t.otherOptions}
        </h2>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/healthcare" size="lg">
            {ui.common.findHealthcare}
          </ButtonLink>
          <ButtonLink href="/concern" size="lg" variant="secondary">
            {ui.common.checkConcern}
          </ButtonLink>
        </div>
      </section>
    </PageShell>
  );
}
