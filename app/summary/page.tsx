import type { Metadata } from "next";
import { SummaryView } from "@/components/summary/summary-view";
import { triageText } from "@/content/en/triage";

export const metadata: Metadata = { title: triageText.summary.title };

export default function SummaryPage() {
  return <SummaryView />;
}
