import { ListenButton } from "@/components/audio/listen-button";
import { HeroActions } from "@/components/home/hero-actions";
import {
  AnywhereSection,
  ChangesSection,
  FaqSection,
  FinalCallToAction,
  HowItHelpsSection,
  PrivacySection,
  StartSection,
  TopicsSection,
} from "@/components/home/home-sections";
import { HeroStage } from "@/components/home/product-stage";
import { ui } from "@/content/en/ui";

export default function WelcomePage() {
  const { home } = ui;
  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      {/* Hero: wording and actions on the left, the animated phone on the right.
          On narrow screens the wording and actions come first, the phone after. */}
      <section aria-labelledby="hero-title" className="relative isolate">
        <div className="hero-glow absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-x-16 gap-y-12 xl:gap-x-24 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:py-16">
          <div className="flex flex-col items-start gap-6 text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink-soft shadow-soft backdrop-blur">
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 font-semibold text-brand-700">{home.eyebrowTag}</span>
              {home.eyebrow}
            </p>

            <h1
              id="hero-title"
              className="text-balance text-[clamp(2.4rem,1.1rem+4.4vw,4.4rem)] font-extrabold leading-[1.04] tracking-tight"
            >
              <span className="block text-brand-600">{home.headlineStart}</span>
              <span className="block">{home.headlineAccent}</span>
            </h1>

            <p className="max-w-[34ch] text-pretty text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-relaxed text-ink-soft">
              {home.support}
            </p>

            <HeroActions align="start" />

            <ListenButton id="welcome" text={home.listenText} audioKey="welcome" className="items-start" />
          </div>

          <HeroStage />
        </div>
      </section>

      <StartSection />
      <HowItHelpsSection />
      <ChangesSection />
      <TopicsSection />
      <AnywhereSection />
      <PrivacySection />
      <FaqSection />
      <FinalCallToAction />
    </div>
  );
}
