import type { Metadata } from "next";
import { HealthcareFinder } from "@/components/healthcare/healthcare-finder";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.finder.title };

export default function HealthcarePage() {
  return <HealthcareFinder />;
}
