"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { ArrowLeft, HomeIcon } from "@/components/ui/icons";
import { useUi } from "@/lib/hooks";

type BackTarget = { href: string } | { onClick: () => void };

/** Back and Home controls shown at the top of every flow screen in place of site navigation. */
export function FlowNav({ back, backLabel }: { back?: BackTarget; backLabel?: string }) {
  const { ui } = useUi();
  const label = backLabel ?? ui.common.back;
  const backClass = buttonClass("secondary", "md");

  return (
    <nav aria-label={ui.common.flowNavigation} className="flex items-center justify-between gap-3">
      {back ? (
        "href" in back ? (
          <Link href={back.href} className={backClass}>
            <ArrowLeft className="size-5" />
            {label}
          </Link>
        ) : (
          <button type="button" onClick={back.onClick} className={backClass}>
            <ArrowLeft className="size-5" />
            {label}
          </button>
        )
      ) : (
        <span />
      )}
      <Link href="/" className={buttonClass("quiet", "md")}>
        <HomeIcon className="size-5" />
        {ui.common.home}
      </Link>
    </nav>
  );
}
