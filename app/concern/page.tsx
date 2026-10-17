import type { Metadata } from "next";
import { ConcernFlow } from "@/components/questionnaire/concern-flow";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.questionnaire.title };

export default function ConcernPage() {
  return <ConcernFlow />;
}
