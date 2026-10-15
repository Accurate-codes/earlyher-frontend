import type { Metadata } from "next";
import { Suspense } from "react";
import { FacilityDetail } from "@/components/healthcare/facility-detail";
import { LoadingState } from "@/components/healthcare/service-states";
import { PageShell } from "@/components/layout/page-shell";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.healthcare.title };

// Facility ids come from the backend at run time, so the id is read on the client
// behind a Suspense boundary and the rest of the page is prerendered as a shell.
export default function FacilityPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <LoadingState label={ui.common.loading} />
        </PageShell>
      }
    >
      <FacilityDetail />
    </Suspense>
  );
}
