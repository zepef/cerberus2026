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

function buildGraphData(allEntities: EntityData[]): GraphData {
  const nodes: GraphNode[] = allEntities.map((e) => ({
    id: e.slug,
    name: e.name,
    type: e.type,
    status: e.status,
    countrySlug: e.countrySlug,
    initials: e.initials,
  }));

  // Build edges from resolved connections (deduplicate)
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const entity of allEntities) {
    for (const conn of entity.connections) {
      if (!conn.resolved) continue;

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
