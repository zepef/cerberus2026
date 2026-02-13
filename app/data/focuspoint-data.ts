import type {
  FocusPointDataset,
  FocusPointData,
  FocusPointSummary,
} from "@/app/lib/types";
import { FocusPointDatasetSchema } from "./schemas";

let _data: FocusPointDataset | null = null;

function loadData(): FocusPointDataset {
  if (_data) return _data;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("@/generated/focuspoint-data.json");
    const parsed = FocusPointDatasetSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("focuspoint-data.json schema validation failed:", parsed.error.issues.slice(0, 5));
      _data = raw as FocusPointDataset;
    } else {
      _data = parsed.data;
    }
    return _data;
  } catch {
    console.warn("focuspoint-data.json not found — returning empty data");
    return {
      focuspoints: [],
      totalFocusPoints: 0,
      generatedAt: "",
    };
  }
}

/** Convert a FocusPointData to a FocusPointSummary */
function toSummary(fp: FocusPointData): FocusPointSummary {
  return {
    slug: fp.slug,
    title: fp.title,
    status: fp.status,
    createdAt: fp.createdAt,
    description: fp.description[0] ?? "",
    linkCount: fp.links.length,
    attachmentCount: fp.attachments.length,
    findingCount: fp.findings.length,
    hasBotData: fp.hasBotData,
  };
}

/** Full focuspoint dataset */
export function getFocusPointDataset(): FocusPointDataset {
  return loadData();
}

/** Summaries for index page (lightweight) */
export function getFocusPointSummaries(): FocusPointSummary[] {
  return loadData().focuspoints.map(toSummary);
}

/** Full focuspoint by slug */
export function getFocusPointBySlug(slug: string): FocusPointData | undefined {
  return loadData().focuspoints.find((fp) => fp.slug === slug);
}

/** All slugs for generateStaticParams */
export function getAllFocusPointSlugs(): string[] {
  return loadData().focuspoints.map((fp) => fp.slug);
}

/** Total count */
export function getTotalFocusPointCount(): number {
  return loadData().totalFocusPoints;
}
