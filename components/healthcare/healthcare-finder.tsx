"use client";

import Link from "next/link";
import { useState } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { optionButtonClass } from "@/components/assessment/concern-picker";
import { PageHeading, PageShell } from "@/components/layout/page-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { ui } from "@/content/en/ui";
import { useMockScenarios, useOnline, useSession } from "@/lib/hooks";
import { facilityService } from "@/lib/services";
import { sessionStore } from "@/lib/session/session-store";
import { useServiceResult } from "@/lib/use-service-result";
import { FacilityDataProblem, LoadingState } from "./service-states";
import { VerificationBadge } from "./verification-badge";

export function HealthcareFinder() {
  const { areaId } = useSession();
  const online = useOnline();
  const scenario = useMockScenarios().facilities;
  const [attempt, setAttempt] = useState(0);
  // Connectivity and retries are part of the key so a change asks again.
  const requestKey = `${attempt}:${scenario}:${online}`;

  const areas = useServiceResult(`areas:${requestKey}`, (signal) => facilityService.listAreas(signal));
  const facilities = useServiceResult(areaId ? `facilities:${areaId}:${requestKey}` : null, (signal) =>
    facilityService.listFacilities(areaId ?? "", signal),
  );

  const retry = () => setAttempt((value) => value + 1);
  const area = areas !== "loading" && areas?.ok ? areas.data.find((item) => item.id === areaId) : undefined;

  let body;
  if (areas === "loading" || areas === null) {
    body = <LoadingState label={ui.healthcare.loadingAreas} />;
  } else if (!areas.ok) {
    body = <FacilityDataProblem error={areas.error} onRetry={retry} />;
  } else if (areas.data.length === 0) {
    body = <FacilityDataProblem error="unavailable" />;
  } else if (!area) {
    body = (
      <>
        {areas.simulated && <Notice tone="demo">{ui.healthcare.demoBanner}</Notice>}
        <h2 className="text-xl font-bold">{ui.healthcare.chooseArea}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {areas.data.map((item) => (
            <li key={item.id}>
              <button type="button" className={optionButtonClass} onClick={() => sessionStore.update({ areaId: item.id })}>
                <span className="flex items-center gap-3">
                  <MapPin className="size-6 shrink-0 text-brand-600" />
                  {item.name}
                </span>
                <ArrowRight className="size-5 shrink-0 text-brand-600" />
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  } else if (facilities === "loading" || facilities === null) {
    body = <LoadingState label={ui.healthcare.loadingFacilities} />;
  } else if (!facilities.ok) {
    body = <FacilityDataProblem error={facilities.error} onRetry={retry} />;
  } else {
    body = (
      <>
        {facilities.simulated && <Notice tone="demo">{ui.healthcare.demoBanner}</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{ui.healthcare.facilitiesIn(area.name)}</h2>
          <Button variant="quiet" onClick={() => sessionStore.update({ areaId: null })}>
            {ui.healthcare.changeArea}
          </Button>
        </div>
        {facilities.data.length === 0 ? (
          <FacilityDataProblem error="unavailable" />
        ) : (
          <ul className="flex flex-col gap-3">
            {facilities.data.map((facility) => (
              <li key={facility.id}>
                <Link
                  href={`/healthcare/${encodeURIComponent(facility.id)}`}
                  className="group flex items-center gap-4 rounded-3xl border border-line bg-white p-4 shadow-soft transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-lift sm:p-5"
                >
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <span className="text-xl font-bold leading-snug">{facility.name}</span>
                    <span className="text-base text-ink-soft">{facility.type}</span>
                    <span className="text-base">{facility.address}</span>
                    {facility.distanceKm !== undefined && (
                      <span className="text-base text-ink-soft">{ui.healthcare.km(facility.distanceKm)}</span>
                    )}
                    <VerificationBadge facility={facility} />
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-base font-semibold text-brand-700">
                    <span className="hidden sm:inline">{ui.healthcare.viewDetails}</span>
                    <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  const emptyArea = area && facilities !== "loading" && facilities?.ok && facilities.data.length === 0;

  return (
    <PageShell>
      <PageHeading title={ui.healthcare.title} lead={emptyArea ? ui.healthcare.empty : ui.healthcare.intro}>
        <ListenButton id="healthcare" text={`${ui.healthcare.title}. ${ui.healthcare.intro}`} audioKey="healthcare" />
      </PageHeading>
      {body}
      <div>
        <ButtonLink href="/" variant="secondary">
          <ArrowLeft className="size-5" />
          {ui.common.back}
        </ButtonLink>
      </div>
    </PageShell>
  );
}
