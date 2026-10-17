import { ReviewBadge } from "@/components/ui/notice";
import { Info } from "@/components/ui/icons";
import { safetyMessage } from "@/content/en/clinical";
import { ui } from "@/content/en/ui";

/** The disclaimer, shown with its review status whenever it is not approved. */
export function SafetyMessage() {
  return (
    <aside
      aria-label={ui.common.important}
      className="flex items-start gap-3 rounded-3xl border border-line bg-brand-50 p-4 text-base leading-relaxed sm:p-5"
    >
      <Info className="mt-0.5 size-6 shrink-0 text-brand-700" />
      <div className="flex min-w-0 flex-col items-start gap-2">
        {/* English only until a reviewed translation exists. */}
        <p lang="en">{safetyMessage.text}</p>
        <ReviewBadge review={safetyMessage.review} />
      </div>
    </aside>
  );
}
