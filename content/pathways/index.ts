import { branchingFixturePathway } from "@/content/fixtures/branching.fixture";
import { appConfig } from "@/lib/config";
import { validatePathway } from "@/lib/engine/pathway-engine";
import type { Pathway } from "@/lib/types/clinical";
import { lumpDemoPathway } from "./lump.demo";

/** Pathways the application can open. Add reviewed pathways here as they are approved. */
const clinicalPathways: Pathway[] = [lumpDemoPathway];

const registry = new Map<string, Pathway>();
for (const pathway of clinicalPathways) registry.set(pathway.id, pathway);
if (appConfig.showDevFixtures) registry.set(branchingFixturePathway.id, branchingFixturePathway);

/** Returns a pathway only if it exists and is structurally sound. */
export function getPathway(id: string | null): Pathway | null {
  if (!id) return null;
  const pathway = registry.get(id);
  if (!pathway || validatePathway(pathway).length > 0) return null;
  return pathway;
}

export const devFixturePathwayId = appConfig.showDevFixtures ? branchingFixturePathway.id : null;
