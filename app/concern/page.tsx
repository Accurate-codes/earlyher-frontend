import type { Metadata } from "next";
import { TriageFlow } from "@/components/triage/triage-flow";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.questionnaire.title };

export default function ConcernPage() {
  return <TriageFlow entry="concern" />;
}
