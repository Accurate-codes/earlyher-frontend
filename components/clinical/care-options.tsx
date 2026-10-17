"use client";

import { Card } from "@/components/layout/page-shell";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { ExternalLink, MapPin, Video } from "@/components/ui/icons";
import { appConfig } from "@/lib/config";
import { useUi } from "@/lib/hooks";

/**
 * The two ways to reach professional care: an approved telemedicine service, or a
 * physical facility through the finder. The telemedicine provider comes only from
 * configuration; without one the card says plainly that it is not available.
 */
export function CareOptions({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const { ui } = useUi();
  const { telemedicine, facility } = ui.results;
  const provider = appConfig.telemedicine;
  const Heading = `h${headingLevel}` as const;

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      <li className="flex">
        <Card className="flex w-full flex-col items-start gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Video className="size-6" />
          </span>
          <Heading className="text-xl font-bold leading-snug">{telemedicine.title}</Heading>
          {provider ? (
            <>
              <p className="text-base leading-relaxed text-ink-soft">{telemedicine.text(provider.name)}</p>
              <p className="text-sm leading-relaxed text-ink-soft">{telemedicine.leaving}</p>
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary", "lg", "mt-auto w-full")}
              >
                {telemedicine.open(provider.name)}
                <ExternalLink className="size-5" />
                <span className="sr-only">{ui.common.opensInNewTab}</span>
              </a>
            </>
          ) : (
            <p className="rounded-2xl border border-line bg-brand-50 px-4 py-3 text-base leading-relaxed">
              {telemedicine.unavailable}
            </p>
          )}
        </Card>
      </li>
      <li className="flex">
        <Card className="flex w-full flex-col items-start gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <MapPin className="size-6" />
          </span>
          <Heading className="text-xl font-bold leading-snug">{facility.title}</Heading>
          <p className="text-base leading-relaxed text-ink-soft">{facility.text}</p>
          <ButtonLink href="/healthcare" size="lg" className="mt-auto w-full">
            {facility.open}
          </ButtonLink>
        </Card>
      </li>
    </ul>
  );
}
