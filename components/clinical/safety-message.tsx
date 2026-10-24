"use client";

import { ReviewBadge } from "@/components/ui/notice";
import { Info } from "@/components/ui/icons";
import { safetyMessage } from "@/content/en/clinical";
import { safetyMessageYo } from "@/content/yo/clinical";
import { useContent } from "@/lib/hooks";

/** The disclaimer, shown with its review status whenever it is not approved. */
export function SafetyMessage() {
  const { ui, locale, safetyText } = useContent();
  // The Yoruba disclaimer carries its own review; the English wording was supplied verbatim.
  const review = locale === "yo" ? safetyMessageYo.review : safetyMessage.review;
  return (
    <aside
      aria-label={ui.common.important}
      className="flex items-start gap-3 rounded-3xl border border-line bg-brand-50 p-4 text-base leading-relaxed sm:p-5"
    >
      <Info className="mt-0.5 size-6 shrink-0 text-brand-700" />
      <div className="flex min-w-0 flex-col items-start gap-2">
        <p lang={locale}>{safetyText}</p>
        <ReviewBadge review={review} />
      </div>
    </aside>
  );
}
