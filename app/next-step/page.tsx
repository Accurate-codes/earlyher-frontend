import type { Metadata } from "next";
import { NextStepView } from "@/components/next-step/next-step-view";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.nextStep.title };

export default function NextStepPage() {
  return <NextStepView />;
}
