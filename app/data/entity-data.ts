import type {
  EntityDataset,
  EntityData,
  EntitySummary,
  GraphData,
} from "@/app/lib/types";

// Import the generated JSON — resolved at build time
let _data: EntityDataset | null = null;

function loadData(): EntityDataset {
  if (_data) return _data;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _data = require("@/generated/entity-data.json") as EntityDataset;
    return _data;
  } catch {
    console.warn("entity-data.json not found — returning empty data");
    return {
      entities: [],
      totalEntities: 0,
      graphData: { nodes: [], edges: [] },
      generatedAt: "",
    };
  }
}

/** Full entity dataset */
export function getEntityDataset(): EntityDataset {
  return loadData();
}

/** All entities */
export function getAllEntities(): EntityData[] {
  return loadData().entities;
}

/** Summaries for index page (lightweight) */
export function getEntitySummaries(): EntitySummary[] {
  return loadData().entities.map((e) => ({
    slug: e.slug,
    type: e.type,
    name: e.name,
    countrySlug: e.countrySlug,
    countryName: e.countryName,
    status: e.status,
    role: e.role,
    initials: e.initials,
    connectionCount: e.connections.length,
    caseCount: e.cases.length,
  }));
}

/** Full entity by slug (e.g., "individual/kurz-sebastian") */
export function getEntityBySlug(slug: string): EntityData | undefined {
  return loadData().entities.find((e) => e.slug === slug);
}

/** All entity slugs for generateStaticParams */
export function getAllEntitySlugs(): { type: string; slug: string }[] {
  return loadData().entities.map((e) => {
    const [type, ...slugParts] = e.slug.split("/");
    return { type, slug: slugParts.join("/") };
  });
}

/** Entities for a specific country */
export function getEntitiesByCountry(countrySlug: string): EntitySummary[] {
  return loadData()
    .entities.filter((e) => e.countrySlug === countrySlug)
    .map((e) => ({
      slug: e.slug,
      type: e.type,
      name: e.name,
      countrySlug: e.countrySlug,
      countryName: e.countryName,
      status: e.status,
      role: e.role,
      initials: e.initials,
      connectionCount: e.connections.length,
      caseCount: e.cases.length,
    }));
}

/** Graph data for the relationship visualization */
export function getGraphData(): GraphData {
  return loadData().graphData;
}

/** Total entity count */
export function getTotalEntityCount(): number {
  return loadData().totalEntities;
}
