import type { Metadata } from "next";
import { PrivacyView } from "@/components/privacy/privacy-view";
import { triageText } from "@/content/en/triage";

export const metadata: Metadata = { title: triageText.privacy.title };

export default function PrivacyPage() {
  return <PrivacyView />;
}
