import * as fs from "fs";
import * as path from "path";
import { EU_COUNTRIES } from "../app/lib/constants";
import { parseLegislationMarkdown } from "./parse-legislation";
import {
  loadEnv,
  getGitHubPat,
  fetchFileContent,
  processBatch,
  REPO_OWNER,
  REPO_NAME,
} from "./lib/github";
import type {
  CountryLegislation,
  LegislationDataset,
  EntityDataset,
} from "../app/lib/types";

loadEnv(path.resolve(__dirname, ".."));

const BASE_PATH = "cerberus/countries";
const CONCURRENCY = 5;
const OUTPUT_PATH = path.resolve(__dirname, "../generated/legislation-data.json");
const ENTITY_DATA_PATH = path.resolve(__dirname, "../generated/entity-data.json");
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

function normalizeNameForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Resolve linked entity names against the entity dataset.
 */
function resolveLinkedEntities(countries: CountryLegislation[]): void {
  // Load entity data if available
  let entityData: EntityDataset | null = null;
  try {
    if (fs.existsSync(ENTITY_DATA_PATH)) {
      const raw = fs.readFileSync(ENTITY_DATA_PATH, "utf-8");
      entityData = JSON.parse(raw) as EntityDataset;
    }
  } catch {
    console.warn("[WARN] Could not load entity-data.json for resolution");
  }

  if (!entityData || entityData.entities.length === 0) {
    console.log("[SKIP] No entity data available for linked entity resolution");
    return;
  }

  // Build lookup tables
  const nameToSlug = new Map<string, string>();
  const normalizedToSlug = new Map<string, string>();

  for (const entity of entityData.entities) {
    nameToSlug.set(entity.name, entity.slug);
    normalizedToSlug.set(normalizeNameForMatching(entity.name), entity.slug);
  }

  let resolvedCount = 0;
  let totalRefs = 0;

  for (const country of countries) {
    for (const entry of country.entries) {
      for (const ref of entry.linkedEntities) {
        totalRefs++;

        // Try exact match
        const exactMatch = nameToSlug.get(ref.displayName);
        if (exactMatch) {
          ref.entitySlug = exactMatch;
          resolvedCount++;
          continue;
        }

        // Try normalized match
        const normalizedMatch = normalizedToSlug.get(
          normalizeNameForMatching(ref.displayName)
        );
        if (normalizedMatch) {
          ref.entitySlug = normalizedMatch;
          resolvedCount++;
        }
      }
    }
  }

  console.log(`  Resolved ${resolvedCount}/${totalRefs} linked entity references`);
}

/**
 * Collect all unique sectors across all countries.
 */
function collectAllSectors(countries: CountryLegislation[]): string[] {
  const sectorSet = new Set<string>();
  for (const country of countries) {
    for (const entry of country.entries) {
      for (const sector of entry.sectors) {
        sectorSet.add(sector);
      }
    }
  }
  return Array.from(sectorSet).sort();
}

async function main() {
  // Check SKIP_FETCH
  if (process.env.SKIP_FETCH && fs.existsSync(OUTPUT_PATH)) {
    console.log("[SKIP] legislation-data.json already exists, skipping fetch.");
    return;
  }

  const pat = getGitHubPat();

  console.log("[START] Fetching legislation data for 27 EU countries...\n");

  const slugs = Object.keys(EU_COUNTRIES);

  const results = await processBatch(
    slugs,
    CONCURRENCY,
    async (slug) => {
      const { name, isoA2 } = EU_COUNTRIES[slug];
      console.log(`  Scanning ${name} (${slug})...`);

      const fileUrl = `${API_BASE}/${BASE_PATH}/${slug}/legislative-changes.md`;
      const content = await fetchFileContent(fileUrl, pat);

      if (!content) {
        console.log(`  [SKIP] ${name}: no legislative-changes.md`);
        return null;
      }

      const legislation = parseLegislationMarkdown(content, slug, name, isoA2);
      console.log(`  [OK] ${name}: ${legislation.entryCount} entries`);
      return legislation;
    }
  );

  const countries: CountryLegislation[] = results.filter(
    (r): r is CountryLegislation => r !== null
  );

  console.log(`\n[RESOLVE] Resolving linked entities...`);
  resolveLinkedEntities(countries);

  const allSectors = collectAllSectors(countries);
  const totalEntries = countries.reduce((sum, c) => sum + c.entryCount, 0);

  const dataset: LegislationDataset = {
    countries,
    totalEntries,
    allSectors,
    generatedAt: new Date().toISOString(),
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2), "utf-8");

  console.log(`\n[DONE] Generated legislation-data.json`);
  console.log(`  Countries with data: ${countries.length}`);
  console.log(`  Total entries: ${totalEntries}`);
  console.log(`  Unique sectors: ${allSectors.length}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
