import type { Metadata } from "next";
import { ConcernPicker } from "@/components/assessment/concern-picker";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.concern.title };

export default function ConcernPage() {
  return <ConcernPicker />;
}
