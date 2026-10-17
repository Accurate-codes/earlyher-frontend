"use client";

import { useEffect, useRef } from "react";
import { buttonClass } from "@/components/ui/button";
import { ArrowRight, ExternalLink, MapPin } from "@/components/ui/icons";
import { useUi } from "@/lib/hooks";
import { directionsUrl, distanceTo, openMapUrl, verifiedValue } from "@/lib/facilities/search";
import type { FacilityRecord, LatLng } from "@/lib/types/facility";

function Field({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-line py-2.5 first:border-t-0 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-base font-semibold text-ink-soft sm:w-44">{label}</dt>
      <dd className={`min-w-0 text-base leading-snug ${muted ? "text-ink-soft" : ""}`}>{value}</dd>
    </div>
  );
}

/**
 * One facility. The heading button opens its details in place and selects it on the map.
 * Only what the source reliably holds is shown; phone, hours and services appear only
 * once verified, and nothing is presented as checked by EarlyHer.
 */
export function FacilityListItem({
  facility,
  origin,
  expanded,
  onToggle,
}: {
  facility: FacilityRecord;
  origin: LatLng | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { ui } = useUi();
  const t = ui.finder;
  const ref = useRef<HTMLLIElement>(null);
  const detailsId = `details-${facility.id.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const km = distanceTo(facility, origin);
  const area = t.area(facility.ward?.value ?? null, facility.lga?.value ?? null, facility.state?.value ?? null);
  const directions = directionsUrl(facility);
  const mapLink = openMapUrl(facility);
  const phone = verifiedValue(facility.phone);
  const hours = verifiedValue(facility.openingHours);
  const services = verifiedValue(facility.services);
  const typeLine = [facility.facilityType?.value, facility.ownership?.value].filter(Boolean).join(" · ");

  // When chosen on the map, bring the details into view.
  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [expanded]);

  return (
    <li
      ref={ref}
      className={`rounded-3xl border bg-white shadow-soft transition-[border-color,box-shadow] ${
        expanded ? "border-brand-600 ring-2 ring-brand-600" : "border-line hover:border-brand-300"
      }`}
    >
      <h3>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
          className="flex w-full items-start gap-4 rounded-3xl p-4 text-left sm:p-5"
        >
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <MapPin className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-lg font-bold leading-snug">{facility.name.value}</span>
            {typeLine && <span className="text-base text-ink-soft">{typeLine}</span>}
            {area && <span className="text-base">{area}</span>}
            {km !== null && <span className="text-base font-semibold text-brand-700">{t.distance(km)}</span>}
          </span>
          <span className="flex shrink-0 items-center gap-1 self-center text-base font-semibold text-brand-700">
            <span className="hidden sm:inline">{expanded ? t.hideDetails : t.showDetails}</span>
            <ArrowRight className={`size-5 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </span>
        </button>
      </h3>

      {expanded && (
        <div id={detailsId} className="flex flex-col gap-4 border-t border-line px-4 pb-5 pt-3 sm:px-5">
          <dl>
            {facility.facilityType && <Field label={t.fields.type} value={facility.facilityType.value} />}
            {facility.level && <Field label={t.fields.level} value={facility.level.value} />}
            {(facility.ownership || facility.ownershipType) && (
              <Field
                label={t.fields.ownership}
                value={[facility.ownership?.value, facility.ownershipType?.value].filter(Boolean).join(" · ")}
              />
            )}
            {area && <Field label={t.fields.area} value={area} />}
            <Field label={t.fields.address} value={facility.address?.value ?? t.addressMissing} muted={!facility.address} />
            {phone && <Field label={t.fields.phone} value={phone} />}
            {hours && <Field label={t.fields.hours} value={hours} />}
            {services && services.length > 0 && <Field label={t.fields.services} value={services.join(", ")} />}
            {facility.hfrCode && <Field label={t.fields.hfrCode} value={facility.hfrCode} />}
            <Field
              label={t.fields.source}
              value={facility.sources
                .map((ref) => [ref.source === "grid3-nga-hf-v2" ? "GRID3 NGA – Health Facilities v2.0" : ref.source, ref.sourceUpdated].filter(Boolean).join(", "))
                .join("; ")}
              muted
            />
          </dl>

          <div className="flex flex-col gap-1.5 text-base leading-relaxed text-ink-soft">
            {facility.verification.status === "unverified" && <p className="font-semibold text-amber-900">{t.notVerified}.</p>}
            {(!phone || !hours || !services) && <p>{t.unverifiedNote}</p>}
            <p>{t.breastCareNote}</p>
            {facility.location && <p>{t.locationNote}</p>}
            {km !== null && <p>{t.distanceNote}</p>}
            {facility.flags.some((flag) => flag.endsWith("name-disagreement")) && <p>{t.nameDisagreement}</p>}
          </div>

          {(directions || mapLink) && (
            <div className="flex flex-col gap-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {directions && (
                  <a href={directions} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg")}>
                    {t.directions}
                    <ExternalLink className="size-5" />
                    <span className="sr-only">{ui.common.opensInNewTab}</span>
                  </a>
                )}
                {mapLink && (
                  <a href={mapLink} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg")}>
                    {t.openMap}
                    <ExternalLink className="size-5" />
                    <span className="sr-only">{ui.common.opensInNewTab}</span>
                  </a>
                )}
              </div>
              <p className="text-sm text-ink-soft">{t.externalNote}</p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
