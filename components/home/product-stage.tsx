import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChatQuestion, MapPin, Speaker } from "@/components/ui/icons";
import { concerns } from "@/content/en/clinical";
import { ui } from "@/content/en/ui";

const CHIPS = concerns.slice(0, 7);
const CHIP_STEP_SECONDS = 1.4;

function FloatingCard({
  icon,
  title,
  text,
  className,
  delay,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  className: string;
  /** Seconds; staggers the entrance and the drift so the cards never move in step. */
  delay: number;
}) {
  return (
    <div className={`card-enter absolute z-10 w-[13.5rem] ${className}`} style={{ "--delay": `${delay}s` } as CSSProperties}>
      <div className="card-float flex items-center gap-3 rounded-3xl border border-white/80 bg-white/90 p-3.5 text-left shadow-lift backdrop-blur">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">{icon}</span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[0.95rem] font-bold leading-snug">{title}</span>
          <span className="text-sm leading-snug text-ink-soft">{text}</span>
        </span>
      </div>
    </div>
  );
}

/** Bars beside the phone's Listen icon that move like a voice playing. */
function SoundBars() {
  return (
    <span className="flex h-4 items-end gap-0.5">
      {[0, 0.2, 0.4].map((delay) => (
        <span key={delay} className="sound-bar w-1 rounded-full bg-white" style={{ animationDelay: `${delay}s` }} />
      ))}
    </span>
  );
}

/**
 * EarlyHer's question screen drawn in markup inside a full phone frame. The selected
 * answer moves from chip to chip, as if someone were choosing what they've noticed.
 */
function Phone() {
  return (
    <div className="phone-rise relative">
      <div className="phone-float rounded-[3rem] border-[11px] border-ink bg-ink shadow-[0_40px_90px_-24px_rgb(125_18_71/0.55)]">
        <div className="relative flex flex-col overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-brand-400 via-brand-500 to-brand-600 px-4 pb-4 pt-3 text-white">
          <span className="screen-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="mb-3 flex items-center justify-between text-xs font-semibold">
            <span>9:41</span>
            <span className="h-5 w-24 rounded-full bg-ink" />
            <span>100%</span>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-full bg-white/20">
              <ArrowLeft className="size-4" />
            </span>
            <Image src="/brand/earlyher-logo.png" alt="" width={36} height={36} className="size-9 rounded-full ring-2 ring-white/50" />
            <span className="flex h-9 items-center gap-1.5 rounded-full bg-white/20 px-2.5">
              <Speaker className="size-4" />
              <SoundBars />
            </span>
          </div>

          <div className="mb-4 flex items-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 flex-1 rounded-full bg-white" />
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="progress-fill block h-full rounded-full bg-white" />
            </span>
            <span className="h-1.5 flex-1 rounded-full bg-white/30" />
          </div>

          <p className="mb-4 text-center text-xl font-bold leading-tight">{ui.concern.title}</p>

          <div className="flex flex-wrap justify-center gap-2">
            {CHIPS.map((concern, index) => (
              <span
                key={concern.id}
                className="chip-cycle rounded-full bg-white/20 px-3.5 py-2 text-xs font-semibold text-white"
                style={
                  {
                    "--chip-delay": `${index * CHIP_STEP_SECONDS}s`,
                    "--chip-cycle": `${CHIPS.length * CHIP_STEP_SECONDS}s`,
                  } as CSSProperties
                }
              >
                {concern.label}
              </span>
            ))}
          </div>

          <span className="next-pulse mx-auto mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-soft">
            {ui.common.next}
            <ArrowRight className="size-4" />
          </span>

          <span className="mx-auto mt-5 h-1 w-24 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}

/**
 * Right-hand side of the hero. The phone rises into place, then floats and sways on
 * breathing rings of light while information cards drift around it. Decorative only:
 * hidden from assistive technology, not interactive, and still when the device asks
 * for reduced motion. Cards are shown from tablet width up, where there is room.
 */
export function HeroStage() {
  const { features } = ui.home;
  return (
    <div aria-hidden="true" inert className="relative mx-auto w-full max-w-[34rem] select-none py-6 sm:py-10">
      <div className="glow-breathe stage-glow absolute left-1/2 top-1/2 -z-10 size-[min(36rem,120%)] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      {[0, 1.6, 3.2].map((delay) => (
        <span
          key={delay}
          className="ripple-ring absolute left-1/2 top-1/2 -z-10 size-[min(30rem,110%)] rounded-full border-2 border-brand-300/60"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
      <span className="orbit absolute left-1/2 top-1/2 -z-10 size-[min(27rem,100%)] rounded-full border border-dashed border-brand-300/70">
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-brand-500 shadow-[0_0_12px_rgb(233_76_153/0.8)]" />
      </span>
      <span className="sparkle absolute left-[12%] top-[18%] size-2 rounded-full bg-brand-400" />
      <span className="sparkle absolute right-[10%] top-[10%] size-1.5 rounded-full bg-brand-500 [animation-delay:1.2s]" />
      <span className="sparkle absolute left-[8%] top-[70%] size-1.5 rounded-full bg-brand-300 [animation-delay:2.4s]" />
      <span className="sparkle absolute right-[14%] top-[80%] size-2 rounded-full bg-brand-400 [animation-delay:3.1s]" />

      <div className="relative mx-auto w-[min(17.5rem,72vw)]">
        <Phone />
      </div>

      <div className="hidden sm:block">
        <FloatingCard
          icon={<BookOpen />}
          title={features.education.title}
          text={features.education.text}
          className="-left-2 top-[14%] lg:-left-10"
          delay={0.6}
        />
        <FloatingCard
          icon={<ChatQuestion />}
          title={features.questions.title}
          text={features.questions.text}
          className="-right-2 top-[44%] lg:-right-6"
          delay={0.9}
        />
        <FloatingCard
          icon={<MapPin />}
          title={features.healthcare.title}
          text={features.healthcare.text}
          className="bottom-[10%] left-0 lg:-left-6"
          delay={1.2}
        />
      </div>
    </div>
  );
}
