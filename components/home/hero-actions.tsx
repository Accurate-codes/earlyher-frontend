"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { ui } from "@/content/en/ui";
import { sessionStore } from "@/lib/session/session-store";

const pill =
  "group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-7 py-3 text-lg font-semibold " +
  "transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 active:translate-y-0 sm:w-auto";

/** The three journeys as the hero's call-to-action buttons, as in the reference design. */
export function HeroActions({ align = "center" }: { align?: "center" | "start" }) {
  const { journeys } = ui.home;
  return (
    <nav aria-label={ui.home.journeysLabel} className="w-full">
      <ul
        className={`flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center ${
          align === "start" ? "justify-start" : "justify-center"
        }`}
      >
        <li>
          <Link
            href="/concern"
            className={`${pill} bg-brand-600 text-white shadow-[0_12px_32px_-10px_rgb(200_30_114/0.7)] hover:bg-brand-700`}
          >
            {journeys.concern.title}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
        <li>
          <Link
            href="/learn"
            onClick={() => sessionStore.update({ arrivedWithoutConcern: true })}
            className={`${pill} border border-line bg-white/90 text-ink shadow-soft hover:border-brand-300`}
          >
            {journeys.learn.title}
            <ArrowRight className="size-5 text-brand-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
        <li>
          <Link
            href="/healthcare"
            className={`${pill} border border-line bg-white/90 text-ink shadow-soft hover:border-brand-300`}
          >
            {journeys.healthcare.title}
            <ArrowRight className="size-5 text-brand-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
