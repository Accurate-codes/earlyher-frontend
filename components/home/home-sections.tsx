import Link from "next/link";
import type { ReactNode } from "react";
import { ModuleIcon } from "@/components/learn/module-icon";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight, Check, ChatQuestion, Lock, MapPin, Phone } from "@/components/ui/icons";
import { ReviewBadge } from "@/components/ui/notice";
import { safetyMessage } from "@/content/en/clinical";
import { educationModules, getEducationModule } from "@/content/en/education";
import { ui } from "@/content/en/ui";
import { HeroActions } from "./hero-actions";
import { JourneyChoices } from "./journey-choices";

function SectionHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <h2 className="text-balance text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-bold leading-tight tracking-tight">{title}</h2>
      <p className="text-pretty text-lg leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}

function Section({ children, tinted = false, label }: { children: ReactNode; tinted?: boolean; label: string }) {
  return (
    <section aria-label={label} className={tinted ? "border-y border-line bg-brand-50/70" : ""}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-20">{children}</div>
    </section>
  );
}

export function StartSection() {
  return (
    <Section label={ui.home.startTitle}>
      <SectionHeading title={ui.home.startTitle} text={ui.home.startText} />
      <JourneyChoices />
    </Section>
  );
}

export function HowItHelpsSection() {
  return (
    <Section tinted label={ui.home.howTitle}>
      <SectionHeading title={ui.home.howTitle} text={ui.home.howText} />
      <ol className="grid gap-4 md:grid-cols-3">
        {ui.home.steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-6 shadow-soft">
            <span className="grid size-11 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
              {index + 1}
            </span>
            <h3 className="text-xl font-bold leading-snug">{step.title}</h3>
            <p className="text-base leading-relaxed text-ink-soft">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Supplied draft education content: the list of changes and the reassurance that follows it. */
export function ChangesSection() {
  const changesModule = getEducationModule("changes-to-look-out-for");
  if (!changesModule) return null;
  const points = changesModule.cards.find((card) => card.points)?.points ?? [];
  const reassurance = changesModule.cards.find((card) => card.callout);

  return (
    <Section label={ui.home.changesTitle}>
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <h2 className="text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-bold leading-tight tracking-tight">{ui.home.changesTitle}</h2>
          <p className="max-w-md text-lg leading-relaxed text-ink-soft">{ui.home.changesText}</p>
          {reassurance && (
            <div className="flex max-w-md flex-col items-start gap-2 rounded-3xl bg-brand-600 p-6 text-left text-white shadow-lift">
              <p className="text-xl font-bold leading-snug">{reassurance.heading}.</p>
              <p className="text-base leading-relaxed text-white/90">{reassurance.body}</p>
              <p className="text-base font-semibold leading-relaxed">{reassurance.callout}</p>
            </div>
          )}
          <ReviewBadge review={changesModule.review} />
        </div>

        <div className="flex flex-col gap-5">
          <ul className="grid gap-3 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <Check className="size-4" />
                </span>
                <span className="text-base font-semibold leading-snug">{point}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/concern" size="lg" className="flex-1">
              {ui.home.changesNoticed}
            </ButtonLink>
            <ButtonLink href={`/learn/${changesModule.slug}`} size="lg" variant="secondary" className="flex-1">
              {ui.home.changesLearn}
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function TopicsSection() {
  return (
    <Section tinted label={ui.home.topicsTitle}>
      <SectionHeading title={ui.home.topicsTitle} text={ui.home.topicsText} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {educationModules.map((topic) => (
          <li key={topic.slug} className="flex">
            <Link
              href={`/learn/${topic.slug}`}
              className="group flex w-full flex-col items-start gap-4 rounded-3xl border border-line bg-white p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
            >
              <ModuleIcon icon={topic.icon} />
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="text-xl font-bold leading-snug tracking-tight">{topic.title}</span>
                <span className="text-base leading-snug text-ink-soft">{topic.summary}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-base font-semibold text-brand-700">
                {ui.home.topicOpen}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const anywhereIcons = [<MapPin key="kiosk" />, <ChatQuestion key="outreach" />, <Phone key="phone" />];

export function AnywhereSection() {
  return (
    <Section label={ui.home.anywhereTitle}>
      <SectionHeading title={ui.home.anywhereTitle} text={ui.home.anywhereText} />
      <ul className="grid gap-4 md:grid-cols-3">
        {ui.home.anywhere.map((item, index) => (
          <li key={item.title} className="flex items-start gap-4 rounded-3xl border border-line bg-white p-6 shadow-soft">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              {anywhereIcons[index]}
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-lg font-bold leading-snug">{item.title}</span>
              <span className="text-base leading-relaxed text-ink-soft">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function FaqSection() {
  return (
    <Section label={ui.home.faqTitle}>
      <SectionHeading title={ui.home.faqTitle} text={ui.home.faqText} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        {ui.home.faq.map((item) => (
          <details key={item.q} className="group rounded-3xl border border-line bg-white shadow-soft open:shadow-lift">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-5 py-4 text-left text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xl leading-none text-brand-700 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="flex flex-col items-start gap-2 px-5 pb-5 text-base leading-relaxed text-ink-soft">
              <p>{item.a}</p>
              {"draft" in item && item.draft && <ReviewBadge review={safetyMessage.review} />}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCallToAction() {
  return (
    <section aria-label={ui.home.ctaTitle} className="px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
      <div className="relative isolate mx-auto flex max-w-5xl flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-line bg-white px-5 py-12 text-center shadow-lift sm:px-10 sm:py-16">
        <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />
        <h2 className="text-balance text-[clamp(1.875rem,1.3rem+2.4vw,3rem)] font-extrabold leading-tight tracking-tight">
          {ui.home.ctaTitle}
        </h2>
        <p className="max-w-[40ch] text-lg leading-relaxed text-ink-soft">{ui.home.ctaText}</p>
        <HeroActions />
      </div>
    </section>
  );
}

export function PrivacySection() {
  return (
    <Section tinted label={ui.home.privacyTitle}>
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Lock className="size-7" />
          </span>
          <h2 className="text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-bold leading-tight tracking-tight">{ui.home.privacyTitle}</h2>
          <p className="max-w-md text-lg leading-relaxed text-ink-soft">{ui.home.boundary}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ui.home.privacy.map((item) => (
            <li key={item.title} className="flex items-start gap-3 rounded-3xl border border-line bg-white p-5 shadow-soft">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                <Check className="size-4" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-lg font-bold leading-snug">{item.title}</span>
                <span className="text-base leading-relaxed text-ink-soft">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
