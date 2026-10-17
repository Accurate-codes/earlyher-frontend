import type { Metadata } from "next";
import { NoConcernView } from "@/components/no-concern/no-concern-view";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.noConcern.title };

export default function NoConcernPage() {
  return <NoConcernView />;
}
