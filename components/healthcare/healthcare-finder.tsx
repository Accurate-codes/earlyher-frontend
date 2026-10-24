"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { FlowNav } from "@/components/layout/flow-nav";
import { useTriageResult } from "@/components/results/results-view";
import { Card, PageHeading } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Crosshair, Info, Search } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { finderSpeech } from "@/lib/audio/page-speech";
import { useMockScenarios, useOnline, useUi } from "@/lib/hooks";
import { loadFacilities } from "@/lib/facilities/service";
import { filterFacilities, listLgas, sortFacilities } from "@/lib/facilities/search";
import type { FacilityDataset, LatLng } from "@/lib/types/facility";
import type { ServiceErrorKind } from "@/lib/types/api";
import { useServiceResult } from "@/lib/use-service-result";
import { AssessmentContext } from "./assessment-context";
import { FacilityListItem } from "./facility-list-item";
import { FacilityMap } from "./facility-map";


const PAGE_SIZE = 25;

type LocationState =
  | { status: "off" }
  | { status: "asking" }
  | { status: "on"; origin: LatLng }
  | { status: "failed"; reason: "denied" | "unavailable" | "unsupported" };

function LoadProblem({ error, onRetry }: { error: ServiceErrorKind; onRetry: () => void }) {
  const { ui } = useUi();
  const t = ui.finder;
  const message = error === "offline" ? t.offline : error === "unavailable" ? t.unavailable : t.failure;
  return (
    <div className="flex flex-col gap-4">
      <Notice tone="warning" role="alert">
        <p className="font-semibold">{message}</p>
        <p className="mt-1">{t.generalHelp}</p>
      </Notice>
      <div>
        <Button size="lg" onClick={onRetry}>
          {ui.common.tryAgain}
        </Button>
      </div>
    </div>
  );
}

function SourceDetails({ dataset }: { dataset: FacilityDataset }) {
  const { ui } = useUi();
  const t = ui.finder;
  return (
    <Card className="flex flex-col gap-3 text-base leading-relaxed">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Info className="size-5 text-brand-700" />
        {t.coverageTitle}
      </h2>
      <p>{t.coverage(dataset.records.length, dataset.coverage.state)}</p>
      <p>{t.breastCareNote}</p>
      <p>{t.unverifiedNote}</p>
      <p>{t.offlineReady}</p>
      {dataset.sources.map((source) => (
        <p key={source.id} className="text-sm text-ink-soft">
          {t.sourceLine(source.name, source.released ?? source.retrievedOn)}{" "}
          {source.publisher}.{" "}
          <a href={source.doi ?? source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
            {source.doi ?? source.url}
          </a>{" "}
          {t.licence}:{" "}
          <a href={source.licenceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
            {source.licence}
          </a>
          . {t.savedOn(dataset.generatedOn)}
        </p>
      ))}
    </Card>
  );
}

function Finder({ dataset, simulated }: { dataset: FacilityDataset; simulated: boolean }) {
  const { ui } = useUi();
  const t = ui.finder;
  const [query, setQuery] = useState("");
  const [lga, setLga] = useState("");
  const [location, setLocation] = useState<LocationState>({ status: "off" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);

  const origin = location.status === "on" ? location.origin : null;
  const lgas = useMemo(() => listLgas(dataset.records), [dataset]);
  const matches = useMemo(
    () => sortFacilities(filterFacilities(dataset.records, { query: deferredQuery, lga }), origin),
    [dataset, deferredQuery, lga, origin],
  );
  const shown = matches.slice(0, limit);
  const selected = selectedId ? matches.find((f) => f.id === selectedId) ?? null : null;
  // A facility picked on the map but outside the shown page is pinned to the top.
  const pinned = selected && !shown.includes(selected) ? selected : null;

  const resetPaging = () => {
    setLimit(PAGE_SIZE);
    setSelectedId(null);
  };

  // Location is asked for only when the person presses the button, and kept in this
  // component's memory only: never stored, logged or sent anywhere.
  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocation({ status: "failed", reason: "unsupported" });
      return;
    }
    setLocation({ status: "asking" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ status: "on", origin: { lat: position.coords.latitude, lng: position.coords.longitude } });
        resetPaging();
      },
      (error) => setLocation({ status: "failed", reason: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable" }),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };

  const select = (id: string) => setSelectedId((current) => (current === id ? null : id));

  const locationMessage =
    location.status === "failed"
      ? location.reason === "denied"
        ? t.locationDenied
        : location.reason === "unsupported"
          ? t.locationUnsupported
          : t.locationUnavailable
      : null;

  return (
    // One map only: on phones it sits between the search and the list; from desktop
    // width it moves to a sticky right-hand column beside them.
    <div className="grid gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-rows-[auto_1fr]">
      <div className="flex min-w-0 flex-col gap-4 lg:col-start-1">
        {simulated && <Notice tone="demo">{t.simulated}</Notice>}

        <form role="search" onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-base font-semibold">
            {t.searchLabel}
            <span className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetPaging();
                }}
                placeholder={t.searchPlaceholder}
                autoComplete="off"
                enterKeyHint="search"
                className="min-h-14 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-lg font-normal shadow-soft placeholder:text-ink-soft/80 focus:border-brand-600"
              />
            </span>
          </label>

          {lgas.length > 0 && (
            <label className="flex flex-col gap-1.5 text-base font-semibold">
              {t.lgaLabel}
              <select
                value={lga}
                onChange={(event) => {
                  setLga(event.target.value);
                  resetPaging();
                }}
                className="min-h-14 w-full rounded-2xl border border-line bg-white px-4 text-lg font-normal shadow-soft focus:border-brand-600"
              >
                <option value="">{t.allLgas}</option>
                {lgas.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {location.status === "on" ? (
              <Button variant="secondary" onClick={() => setLocation({ status: "off" })}>
                {t.stopLocation}
              </Button>
            ) : (
              <Button variant="secondary" onClick={requestLocation} disabled={location.status === "asking"}>
                <Crosshair className="size-5" />
                {location.status === "asking" ? t.locating : t.useLocation}
              </Button>
            )}
            {(query || lga) && (
              <Button
                variant="quiet"
                onClick={() => {
                  setQuery("");
                  setLga("");
                  resetPaging();
                }}
              >
                {t.clearFilters}
              </Button>
            )}
          </div>
          <div aria-live="polite" className="flex flex-col gap-1 text-base">
            {location.status === "on" && (
              <p>
                <span className="font-semibold">{t.locationOn}.</span> <span className="text-ink-soft">{t.locationPrivacy}</span>
              </p>
            )}
            {locationMessage && <p className="font-semibold text-amber-900">{locationMessage}</p>}
          </div>
        </form>
      </div>

      <div className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <FacilityMap facilities={matches} selectedId={selectedId} origin={origin} onSelect={select} />
        <p className="text-sm text-ink-soft">{t.mapHelp}</p>
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:col-start-1">
        <section aria-labelledby="facility-list-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="facility-list-heading" className="text-xl font-bold">
              {t.listLabel}
            </h2>
            <p aria-live="polite" className="text-base text-ink-soft">
              {t.results(shown.length, matches.length)}
            </p>
          </div>

          {dataset.records.length === 0 ? (
            <Notice tone="warning">
              <p className="font-semibold">{t.noData}</p>
              <p className="mt-1">{t.generalHelp}</p>
            </Notice>
          ) : matches.length === 0 ? (
            <Notice>
              <p className="font-semibold">{t.empty}</p>
              <p className="mt-1">{t.emptyHelp}</p>
            </Notice>
          ) : (
            <ul className="flex flex-col gap-3">
              {pinned && (
                <FacilityListItem facility={pinned} origin={origin} expanded onToggle={() => select(pinned.id)} />
              )}
              {shown.map((facility) => (
                <FacilityListItem
                  key={facility.id}
                  facility={facility}
                  origin={origin}
                  expanded={facility.id === selectedId}
                  onToggle={() => select(facility.id)}
                />
              ))}
            </ul>
          )}

          {shown.length < matches.length && (
            <Button variant="secondary" size="lg" onClick={() => setLimit((value) => value + PAGE_SIZE)}>
              {t.showMore}
            </Button>
          )}
        </section>

        <SourceDetails dataset={dataset} />
      </div>
    </div>
  );
}

export function HealthcareFinder() {
  const { ui } = useUi();
  const online = useOnline();
  const scenario = useMockScenarios().facilities;
  const guidance = useTriageResult()?.evaluation ?? null;
  const [attempt, setAttempt] = useState(0);
  const result = useServiceResult(`facilities:${attempt}:${scenario}:${online}`, (signal) => loadFacilities(signal));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <FlowNav back={{ href: "/" }} />
      <PageHeading title={ui.finder.title} lead={ui.finder.intro}>
        <ListenButton id={`finder-${guidance?.outcome ?? "none"}`} ids={finderSpeech(guidance)} />
      </PageHeading>
      <AssessmentContext />
      {result === "loading" || result === null ? (
        <p role="status" className="flex items-center justify-center gap-3 py-10 text-lg font-semibold text-ink-soft">
          <span className="pulse-dot size-3 rounded-full bg-brand-500" aria-hidden="true" />
          {ui.finder.loading}
        </p>
      ) : result.ok ? (
        <Finder dataset={result.data} simulated={result.simulated} />
      ) : (
        <LoadProblem error={result.error} onRetry={() => setAttempt((value) => value + 1)} />
      )}
    </div>
  );
}
