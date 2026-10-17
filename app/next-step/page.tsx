import type { Metadata } from "next";
import { ResultsView } from "@/components/results/results-view";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.results.title };

export default function NextStepPage() {
  return <ResultsView />;
}
