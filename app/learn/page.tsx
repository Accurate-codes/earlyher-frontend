import type { Metadata } from "next";
import { TopicMenu } from "@/components/learn/topic-menu";
import { ui } from "@/content/en/ui";

export const metadata: Metadata = { title: ui.nav.learn };

export default function LearnPage() {
  return <TopicMenu />;
}
