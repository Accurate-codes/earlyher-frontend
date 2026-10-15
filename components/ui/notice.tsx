import type { ReactNode } from "react";
import { ui } from "@/content/en/ui";
import type { ClinicalReview } from "@/lib/types/clinical";
import { Info } from "./icons";

/** Marks wording that has not been approved by the clinical team. Hidden once content is approved. */
export function ReviewBadge({ review }: { review: ClinicalReview }) {
  if (review.status === "approved") return null;
  return (
    <span
      title={review.note ?? ui.common.draftLong}
      className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900"
    >
      {ui.common.draft}
      <span className="sr-only">: {ui.common.draftLong}</span>
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky-900">
      {ui.common.demo}
    </span>
  );
}

type Tone = "info" | "demo" | "warning";

const tones: Record<Tone, string> = {
  info: "border-line bg-brand-50 text-ink",
  demo: "border-sky-200 bg-sky-50 text-sky-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
};

export function Notice({
  tone = "info",
  children,
  role,
}: {
  tone?: Tone;
  children: ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <div role={role} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-base leading-relaxed ${tones[tone]}`}>
      <Info className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
