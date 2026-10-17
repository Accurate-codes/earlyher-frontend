"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChatQuestion, Heart, MapPin } from "@/components/ui/icons";
import { useUi } from "@/lib/hooks";

interface Journey {
  href: string;
  title: string;
  text: string;
  icon: ReactNode;
  primary?: boolean;
}

/** The three ways into the application. Real links, so they work with keyboard, touch and screen readers. */
export function JourneyChoices() {
  const { ui } = useUi();
  const journeys: Journey[] = [
    { href: "/concern", ...ui.home.journeys.concern, icon: <ChatQuestion className="size-7" />, primary: true },
    { href: "/no-concern", ...ui.home.journeys.noConcern, icon: <Heart className="size-7" /> },
    { href: "/healthcare", ...ui.home.journeys.healthcare, icon: <MapPin className="size-7" /> },
  ];

  return (
    <nav aria-label={ui.home.journeysLabel} className="w-full">
      <ul className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {journeys.map((journey) => (
          <li key={journey.href} className="flex">
            <Link
              href={journey.href}
              className={`group flex min-h-24 w-full items-center gap-4 rounded-[1.75rem] border p-4 text-left shadow-soft transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 sm:p-5 md:flex-col md:items-start md:gap-5 md:p-6 ${
                journey.primary
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-white text-ink hover:border-brand-300"
              }`}
            >
              <span
                className={`grid size-14 shrink-0 place-items-center rounded-2xl ${
                  journey.primary ? "bg-white/18 text-white" : "bg-brand-100 text-brand-700"
                }`}
              >
                {journey.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xl font-bold leading-snug tracking-tight">{journey.title}</span>
                <span className={`text-base leading-snug ${journey.primary ? "text-white/90" : "text-ink-soft"}`}>
                  {journey.text}
                </span>
              </span>
              <ArrowRight
                className={`size-6 shrink-0 transition-transform group-hover:translate-x-1 md:self-end ${
                  journey.primary ? "text-white" : "text-brand-600"
                }`}
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
