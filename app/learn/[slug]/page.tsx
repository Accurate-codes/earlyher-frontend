import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModuleViewer } from "@/components/learn/module-viewer";
import { educationModules, getEducationModule } from "@/content/en/education";

// Every topic is known at build time, so each page is prerendered and available offline.
export function generateStaticParams() {
  return educationModules.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getEducationModule(slug)?.title };
}

export default async function LearnTopicPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const topic = getEducationModule(slug);
  if (!topic) notFound();
  return <ModuleViewer key={topic.slug} module={topic} />;
}
