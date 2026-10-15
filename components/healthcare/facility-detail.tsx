"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, PageHeading, PageShell } from "@/components/layout/page-shell";
import { useShare } from "@/components/share/share-actions";
import { isPublicUrl, QrCode } from "@/components/share/qr-code";
import { Button, ButtonLink } from "@/components/ui/button";
import { ArrowLeft, Phone, Printer } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { ui } from "@/content/en/ui";
import { useMockScenarios, useOnline } from "@/lib/hooks";
import { facilityService } from "@/lib/services";
import type { Facility } from "@/lib/types/api";
import { useServiceResult } from "@/lib/use-service-result";
import { FacilityDataProblem, LoadingState } from "./service-states";
import { VerificationBadge } from "./verification-badge";

function Field({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-line py-3 first:border-t-0 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-base font-semibold text-ink-soft sm:w-40">{label}</dt>
      <dd className={`min-w-0 text-lg leading-snug ${value ? "" : "text-ink-soft"}`}>{value ?? ui.healthcare.notProvided}</dd>
    </div>
  );
}

function FacilityCard({ facility, simulated }: { facility: Facility; simulated: boolean }) {
  const share = useShare({ facility });
  const shareable = facility.verification.status === "verified" || facility.demo;

  return (
    <>
      {(simulated || facility.demo) && <Notice tone="demo">{ui.healthcare.demoBanner}</Notice>}

      <PageHeading title={facility.name} lead={facility.type}>
        <VerificationBadge facility={facility} />
      </PageHeading>

      <Card>
        <dl>
          <Field label={ui.healthcare.fields.address} value={facility.address} />
          <Field label={ui.healthcare.fields.services} value={facility.services.join(", ") || undefined} />
          <Field label={ui.healthcare.fields.hours} value={facility.openingHours} />
          <Field label={ui.healthcare.fields.phone} value={facility.phone} />
          <Field label={ui.healthcare.fields.directions} value={facility.directions} />
          {facility.distanceKm !== undefined && (
            <Field label={ui.healthcare.fields.distance} value={ui.healthcare.km(facility.distanceKm)} />
          )}
        </dl>
        {isPublicUrl(facility.publicUrl) && (
          <figure className="mt-4 flex items-center gap-4 border-t border-line pt-4">
            <QrCode url={facility.publicUrl} label={ui.print.qrCaption} />
            <figcaption className="text-base text-ink-soft">{ui.print.qrCaption}</figcaption>
          </figure>
        )}
      </Card>

      {shareable && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" variant="secondary" onClick={share.openPrint}>
            <Printer className="size-6" />
            {ui.common.print}
          </Button>
          <Button size="lg" variant="secondary" onClick={share.openSms}>
            <Phone className="size-6" />
            {ui.common.sendBySms}
          </Button>
        </div>
      )}
      {share.dialogs}
    </>
  );
}

export function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const online = useOnline();
  const scenario = useMockScenarios().facilities;
  const [attempt, setAttempt] = useState(0);
  const result = useServiceResult(`facility:${id}:${attempt}:${scenario}:${online}`, (signal) =>
    facilityService.getFacility(id, signal),
  );

  return (
    <PageShell>
      {result === "loading" || result === null ? (
        <LoadingState label={ui.common.loading} />
      ) : result.ok ? (
        <FacilityCard facility={result.data} simulated={result.simulated} />
      ) : (
        <>
          <PageHeading title={ui.healthcare.title} />
          <FacilityDataProblem error={result.error} onRetry={() => setAttempt((value) => value + 1)} />
        </>
      )}
      <div>
        <ButtonLink href="/healthcare" variant="secondary">
          <ArrowLeft className="size-5" />
          {ui.healthcare.backToList}
        </ButtonLink>
      </div>
    </PageShell>
  );
}
