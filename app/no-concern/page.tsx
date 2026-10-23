import type { Metadata } from "next";
import { TriageFlow } from "@/components/triage/triage-flow";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.noConcern.title };

export default function NoConcernPage() {
  return <TriageFlow entry="no-concern" />;
}
