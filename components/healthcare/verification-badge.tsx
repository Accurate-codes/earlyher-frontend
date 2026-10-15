import { DemoBadge } from "@/components/ui/notice";
import { ui } from "@/content/en/ui";
import type { Facility } from "@/lib/types/api";

export function VerificationBadge({ facility }: { facility: Facility }) {
  if (facility.demo) return <DemoBadge />;
  const verified = facility.verification.status === "verified";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold ${
        verified ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      {verified
        ? facility.verification.verifiedOn
          ? ui.healthcare.verifiedOn(facility.verification.verifiedOn)
          : ui.healthcare.verified
        : ui.healthcare.unverified}
    </span>
  );
}
