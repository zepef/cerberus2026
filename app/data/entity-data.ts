import type {
  EntityDataset,
  EntityData,
  EntitySummary,
  GraphData,
} from "@/app/lib/types";
import { EntityDatasetSchema } from "./schemas";

// Import the generated JSON — resolved at build time
let _data: EntityDataset | null = null;

function loadData(): EntityDataset {
  if (_data) return _data;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("@/generated/entity-data.json");
    const parsed = EntityDatasetSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("entity-data.json schema validation failed:", parsed.error.issues.slice(0, 5));
      _data = raw as EntityDataset;
    } else {
      _data = parsed.data;
    }
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

/** Convert an EntityData to an EntitySummary */
function toSummary(e: EntityData): EntitySummary {
  return {
    slug: e.slug,
    type: e.type,
    name: e.name,
    countrySlug: e.countrySlug,
    countryName: e.countryName,
    status: e.status,
    role: e.role,
    initials: e.initials,
    imageUrl: e.imageUrl,
    profileTitle: e.profileTitle ?? null,
    profileSummary: e.profileSummary ?? null,
    connectionCount: e.connections.length,
    caseCount: e.cases.length,
  };
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
  return loadData().entities.map(toSummary);
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
    .map(toSummary);
}

/** Graph data for the relationship visualization */
export function getGraphData(): GraphData {
  return loadData().graphData;
}

/** Total entity count */
export function getTotalEntityCount(): number {
  return loadData().totalEntities;
}
