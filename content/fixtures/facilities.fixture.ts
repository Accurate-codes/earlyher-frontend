import type { Area, Facility } from "@/lib/types/api";

/**
 * FICTIONAL LAYOUT FIXTURES. These are not real places. They exist only so the
 * facility list and detail layouts can be reviewed before a verified data source
 * is supplied, and deliberately carry no phone numbers, directions or distances.
 */

export const fixtureAreas: Area[] = [
  { id: "demo-area-1", name: "Demo Area One (not a real place)" },
  { id: "demo-area-2", name: "Demo Area Two (not a real place)" },
];

export const fixtureFacilities: Facility[] = [
  {
    id: "demo-facility-a",
    name: "Demo Health Centre A",
    type: "Primary healthcare centre (example)",
    areaId: "demo-area-1",
    address: "Example address line, Demo Area One",
    services: ["Example service one", "Example service two"],
    openingHours: "Example opening hours",
    verification: { status: "unverified", source: "Layout fixture" },
    demo: true,
  },
  {
    id: "demo-facility-b",
    name: "Demo Clinic B",
    type: "General hospital (example)",
    areaId: "demo-area-1",
    address: "Example address line, Demo Area One",
    services: ["Example service one"],
    verification: { status: "unverified", source: "Layout fixture" },
    demo: true,
  },
  {
    id: "demo-facility-c",
    name: "Demo Health Post C",
    type: "Primary healthcare centre (example)",
    areaId: "demo-area-2",
    address: "Example address line, Demo Area Two",
    services: ["Example service one", "Example service two", "Example service three"],
    openingHours: "Example opening hours",
    verification: { status: "unverified", source: "Layout fixture" },
    demo: true,
  },
];
