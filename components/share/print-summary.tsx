/* eslint-disable @next/next/no-img-element -- a plain <img> prints reliably; next/image lazy-loading does not. */
import { generalGuidance, safetyMessage } from "@/content/en/clinical";
import { ui } from "@/content/en/ui";
import { appConfig } from "@/lib/config";
import type { Facility } from "@/lib/types/api";
import type { Recommendation } from "@/lib/types/clinical";
import { isPublicUrl, QrCode } from "./qr-code";

export interface ShareContent {
  /** The next step reached by the pathway, when there is one. */
  recommendation?: Recommendation | null;
  /** A facility the person was viewing. Printed only when verified (or labelled as demo data). */
  facility?: Facility | null;
}

/**
 * The printed page. It carries guidance and facility details only: no answers,
 * no phone number, no recording, and nothing personal in the QR code.
 */
export function PrintSummary({ content, onScreen = false }: { content: ShareContent; onScreen?: boolean }) {
  const { recommendation, facility } = content;
  const printableFacility = facility && (facility.verification.status === "verified" || facility.demo) ? facility : null;
  const qrUrl = [printableFacility?.publicUrl, appConfig.publicInfoUrl].find(isPublicUrl);
  const draft = (recommendation ?? generalGuidance).review.status !== "approved";

  return (
    <article
      className={`flex flex-col gap-4 bg-white text-black ${
        appConfig.printLayout === "thermal-80" ? "print-thermal-80" : ""
      } ${onScreen ? "rounded-2xl border border-line p-5" : ""}`}
    >
      <header className="flex items-center gap-3 border-b border-black/20 pb-3">
        <img src="/brand/earlyher-logo.png" alt={ui.logoAlt} width={56} height={56} className="size-14" />
        <p className="text-xl font-bold leading-tight">{ui.appName}</p>
      </header>

      <section>
        <h3 className="text-lg font-bold">{ui.print.nextStepHeading}</h3>
        <p className="mt-1 text-base leading-relaxed">{recommendation ? recommendation.text : generalGuidance.text}</p>
        {recommendation && <p className="mt-2 text-base leading-relaxed">{recommendation.why}</p>}
        {draft && <p className="mt-2 text-sm font-semibold uppercase">{ui.common.draftLong}</p>}
      </section>

      {printableFacility && (
        <section>
          <h3 className="text-lg font-bold">{ui.print.facilityHeading}</h3>
          {printableFacility.demo && <p className="text-sm font-semibold uppercase">{ui.common.demo}</p>}
          <p className="mt-1 text-base font-semibold">{printableFacility.name}</p>
          <p className="text-base">{printableFacility.address}</p>
          {printableFacility.openingHours && <p className="text-base">{printableFacility.openingHours}</p>}
          {printableFacility.phone && (
            <p className="text-base">
              {ui.finder.fields.phone}: {printableFacility.phone}
            </p>
          )}
          {printableFacility.directions && <p className="text-base">{printableFacility.directions}</p>}
        </section>
      )}

      <section>
        <h3 className="text-lg font-bold">{ui.print.generalHeading}</h3>
        <p className="mt-1 text-base leading-relaxed">{safetyMessage.text}</p>
      </section>

      {qrUrl ? (
        <figure className="flex items-center gap-3">
          <QrCode url={qrUrl} label={ui.print.qrCaption} />
          <figcaption className="text-sm">{ui.print.qrCaption}</figcaption>
        </figure>
      ) : (
        onScreen && <p className="rounded-xl border border-dashed border-line p-3 text-sm text-ink-soft">{ui.print.qrMissing}</p>
      )}

      <footer className="border-t border-black/20 pt-3 text-sm">{ui.print.footer}</footer>
    </article>
  );
}
