import type {
  LegislationDataset,
  CountryLegislation,
  LegislationSummary,
} from "@/app/lib/types";

// Import the generated JSON — resolved at build time
let _data: LegislationDataset | null = null;

function loadData(): LegislationDataset {
  if (_data) return _data;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _data = require("@/generated/legislation-data.json") as LegislationDataset;
    return _data;
  } catch {
    console.warn("legislation-data.json not found — returning empty data");
    return {
      countries: [],
      totalEntries: 0,
      allSectors: [],
      generatedAt: "",
    };
  }
}

/** Full legislation dataset */
export function getLegislationDataset(): LegislationDataset {
  return loadData();
}

/** Flat summaries for index page (lightweight) */
export function getLegislationSummaries(): LegislationSummary[] {
  const data = loadData();
  const summaries: LegislationSummary[] = [];

  for (const country of data.countries) {
    for (const entry of country.entries) {
      summaries.push({
        id: entry.id,
        title: entry.title,
        status: entry.status,
        date: entry.date,
        sectors: entry.sectors,
        impact: entry.impact,
        countrySlug: country.countrySlug,
        countryName: country.countryName,
        linkedEntityCount: entry.linkedEntities.length,
        sourceCount: entry.sources.length,
        category: entry.category,
      });
    }
  }

  return summaries;
}

/** Legislation data for a specific country */
export function getLegislationByCountry(slug: string): CountryLegislation | undefined {
  return loadData().countries.find((c) => c.countrySlug === slug);
}

/** All unique sectors */
export function getAllSectors(): string[] {
  return loadData().allSectors;
}

/** Total legislation entry count */
export function getTotalLegislationCount(): number {
  return loadData().totalEntries;
}
