import * as fs from "fs";
import * as path from "path";
import { EU_COUNTRIES } from "../app/lib/constants";
import { parseEntityMarkdown } from "./parse-entity";
import {
  loadEnv,
  getGitHubPat,
  ghFetch,
  fetchFileContent,
  processBatch,
  REPO_OWNER,
  REPO_NAME,
} from "./lib/github";
import type {
  EntityData,
  EntityType,
  EntityDataset,
  GraphNode,
  GraphEdge,
  GraphData,
} from "../app/lib/types";

loadEnv(path.resolve(__dirname, ".."));

const BASE_PATH = "cerberus/countries";
const CONCURRENCY = 5;
const OUTPUT_PATH = path.resolve(__dirname, "../generated/entity-data.json");
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

// Map directory name to EntityType
function dirToType(dir: string): EntityType {
  const map: Record<string, EntityType> = {
    individuals: "individual",
    companies: "company",
    "foreign-states": "foreign-state",
    organizations: "organization",
  };
  return map[dir] || "individual";
}

// Slug from filename: "kurz-sebastian.md" -> "kurz-sebastian"
function fileToSlug(filename: string): string {
  return filename.replace(/\.md$/, "");
}

interface GitHubFile {
  name: string;
  type: string;
  path: string;
  download_url: string | null;
}

async function listDirectory(
  dirPath: string,
  pat: string
): Promise<GitHubFile[]> {
  const url = `${API_BASE}/${dirPath}`;
  const response = await ghFetch(url, pat);
  if (!response.ok) return [];
  return (await response.json()) as GitHubFile[];
}

async function fetchEntitiesForCountry(
  countrySlug: string,
  countryName: string,
  pat: string
): Promise<EntityData[]> {
  const entities: EntityData[] = [];
  const entitiesBase = `${BASE_PATH}/${countrySlug}/entities`;

  // List entity type directories
  const typeDirs = await listDirectory(entitiesBase, pat);
  if (typeDirs.length === 0) return entities;

  for (const typeDir of typeDirs) {
    if (typeDir.type !== "dir") continue;
    const dirName = typeDir.name;
    const entityType = dirToType(dirName);

    // List files in this type directory
    const files = await listDirectory(`${entitiesBase}/${dirName}`, pat);
    const mdFiles = files.filter(
      (f) =>
        f.name.endsWith(".md") &&
        f.name.toLowerCase() !== "readme.md"
    );

    for (const file of mdFiles) {
      const fileUrl = `${API_BASE}/${entitiesBase}/${dirName}/${file.name}`;
      const content = await fetchFileContent(fileUrl, pat);
      if (!content) continue;

      const slug = `${entityType}/${fileToSlug(file.name)}`;
      const entity = parseEntityMarkdown(
        content,
        entityType,
        slug,
        countrySlug,
        countryName
      );
      entities.push(entity);
      console.log(`    [OK] ${countrySlug}/${dirName}/${file.name} → ${entity.name}`);
    }
  }

  return entities;
}

function normalizeNameForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

function resolveConnections(allEntities: EntityData[]): void {
  // Build lookup tables
  const nameToSlug = new Map<string, string>();
  const normalizedToSlug = new Map<string, string>();

  for (const entity of allEntities) {
    nameToSlug.set(entity.name, entity.slug);
    normalizedToSlug.set(normalizeNameForMatching(entity.name), entity.slug);
  }

  // Resolve connections
  for (const entity of allEntities) {
    for (const conn of entity.connections) {
      // Try exact match
      const exactMatch = nameToSlug.get(conn.targetName);
      if (exactMatch) {
        conn.targetSlug = exactMatch;
        conn.resolved = true;
        continue;
      }

      // Try normalized match
      const normalizedMatch = normalizedToSlug.get(
        normalizeNameForMatching(conn.targetName)
      );
      if (normalizedMatch) {
        conn.targetSlug = normalizedMatch;
        conn.resolved = true;
      }
    }
  }
}

interface WikipediaQueryResponse {
  query?: {
    pages?: Record<
      string,
      {
        thumbnail?: { source: string };
      }
    >;
  };
}

async function fetchWikipediaImage(name: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=200&redirects=1`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "cerberus2026-dashboard" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as WikipediaQueryResponse;
    const pages = data.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

async function fetchWikipediaImages(allEntities: EntityData[]): Promise<void> {
  await processBatch(allEntities, CONCURRENCY, async (entity) => {
    const imageUrl = await fetchWikipediaImage(entity.name);
    entity.imageUrl = imageUrl;
    if (imageUrl) {
      console.log(`  [IMG] ${entity.name} → found`);
    }
  });
}

function generateEntityProfiles(allEntities: EntityData[]): void {
  for (const entity of allEntities) {
    if (entity.profileTitle && entity.profileSummary) continue; // already set

    const caseNames = entity.cases.map((c) => c.title).filter(Boolean);
    const topCase = caseNames[0] || null;

    // Generate title
    if (entity.type === "individual") {
      if (topCase) {
        entity.profileTitle = `${entity.role || "Figure"} linked to ${topCase}`;
      } else {
        entity.profileTitle = `${entity.role || "Individual"} under ${entity.status} in ${entity.countryName}`;
      }
    } else if (entity.type === "company") {
      entity.profileTitle = `${entity.name} — corporate involvement in ${entity.countryName}`;
    } else if (entity.type === "foreign-state") {
      entity.profileTitle = `${entity.name} — foreign influence in EU affairs`;
    } else {
      entity.profileTitle = `${entity.name} — ${entity.type} tracked in ${entity.countryName}`;
    }

    // Generate summary from cases + bio
    const parts: string[] = [];
    if (entity.role) parts.push(entity.role + ".");
    if (entity.status !== "unknown") parts.push(`Status: ${entity.status}.`);
    if (caseNames.length > 0) {
      parts.push(`Linked to ${caseNames.length} case${caseNames.length > 1 ? "s" : ""}: ${caseNames.slice(0, 3).join(", ")}${caseNames.length > 3 ? "..." : ""}.`);
    }
    if (entity.connections.length > 0) {
      parts.push(`${entity.connections.length} known connection${entity.connections.length > 1 ? "s" : ""}.`);
    }

    entity.profileSummary = parts.join(" ") || null;
  }
}

function buildGraphData(allEntities: EntityData[]): GraphData {
  const nodeIds = new Set(allEntities.map((e) => e.slug));
  const nodes: GraphNode[] = allEntities.map((e) => ({
    id: e.slug,
    name: e.name,
    type: e.type,
    status: e.status,
    countrySlug: e.countrySlug,
    initials: e.initials,
  }));

  // Build edges from resolved connections (deduplicate, skip dangling)
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const entity of allEntities) {
    for (const conn of entity.connections) {
      if (!conn.resolved) continue;
      // Skip edges where target node doesn't exist
      if (!nodeIds.has(conn.targetSlug)) continue;

      // Deduplicate: A→B and B→A should be one edge
      const key = [entity.slug, conn.targetSlug].sort().join("↔");
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);

      edges.push({
        source: entity.slug,
        target: conn.targetSlug,
        relationship: conn.relationship,
      });
    }
  }

  return { nodes, edges };
}

async function main() {
  // Check SKIP_FETCH
  if (process.env.SKIP_FETCH && fs.existsSync(OUTPUT_PATH)) {
    console.log("[SKIP] entity-data.json already exists, skipping fetch.");
    return;
  }

  const pat = getGitHubPat();

  console.log("[START] Fetching entity data for 27 EU countries...\n");

  const slugs = Object.keys(EU_COUNTRIES);
  const allEntities: EntityData[] = [];

  const results = await processBatch(
    slugs,
    CONCURRENCY,
    async (slug) => {
      const { name } = EU_COUNTRIES[slug];
      console.log(`  Scanning ${name} (${slug})...`);
      const entities = await fetchEntitiesForCountry(slug, name, pat);
      if (entities.length === 0) {
        console.log(`  [SKIP] ${name}: no entities`);
      } else {
        console.log(`  [OK] ${name}: ${entities.length} entities`);
      }
      return entities;
    }
  );

  for (const countryEntities of results) {
    allEntities.push(...countryEntities);
  }

  console.log(`\n[RESOLVE] Resolving connections across ${allEntities.length} entities...`);
  resolveConnections(allEntities);

  const resolvedCount = allEntities.reduce(
    (sum, e) => sum + e.connections.filter((c) => c.resolved).length,
    0
  );
  const totalConns = allEntities.reduce(
    (sum, e) => sum + e.connections.length,
    0
  );
  console.log(`  Resolved ${resolvedCount}/${totalConns} connections`);

  console.log("[IMAGES] Fetching Wikipedia images...");
  await fetchWikipediaImages(allEntities);
  const imageCount = allEntities.filter((e) => e.imageUrl).length;
  console.log(`  Found images for ${imageCount}/${allEntities.length} entities`);

  console.log("[PROFILES] Generating entity profiles...");
  generateEntityProfiles(allEntities);
  const profileCount = allEntities.filter((e) => e.profileTitle).length;
  console.log(`  Generated profiles for ${profileCount} entities`);

  console.log("[GRAPH] Building graph data...");
  const graphData = buildGraphData(allEntities);
  console.log(`  Nodes: ${graphData.nodes.length}, Edges: ${graphData.edges.length}`);

  const dataset: EntityDataset = {
    entities: allEntities,
    totalEntities: allEntities.length,
    graphData,
    generatedAt: new Date().toISOString(),
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2), "utf-8");

  console.log(`\n[DONE] Generated entity-data.json`);
  console.log(`  Entities: ${allEntities.length}`);
  console.log(`  Graph nodes: ${graphData.nodes.length}`);
  console.log(`  Graph edges: ${graphData.edges.length}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
