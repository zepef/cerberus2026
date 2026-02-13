import * as fs from "fs";
import * as path from "path";
import {
  loadEnv,
  getGitHubPat,
  ghFetch,
  fetchFileContent,
  REPO_OWNER,
  REPO_NAME,
} from "./lib/github";
import {
  parsePlanMarkdown,
  parseFindingsMarkdown,
  parseTimelineMarkdown,
  parseEntitiesMarkdown,
  parseSourcesMarkdown,
} from "./parse-focuspoint";
import type {
  FocusPointData,
  FocusPointDataset,
  FocusPointAttachment,
} from "../app/lib/types";

loadEnv(path.resolve(__dirname, ".."));

const FOCUSPOINTS_PATH = "cerberus/focuspoints";
const OUTPUT_PATH = path.resolve(__dirname, "../generated/focuspoint-data.json");
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

interface GitHubFile {
  name: string;
  type: string;
  path: string;
  size?: number;
  download_url: string | null;
}

async function listDirectory(
  dirPath: string,
  pat: string
): Promise<GitHubFile[]> {
  const url = `${API_BASE}/${dirPath}`;
  const response = await ghFetch(url, pat);
  if (!response.ok) {
    if (response.status === 404) return [];
    console.warn(`  [WARN] listDirectory: HTTP ${response.status} for ${url}`);
    return [];
  }
  return (await response.json()) as GitHubFile[];
}

// Try to resolve entity refs against existing entity-data.json
function resolveEntityRefs(focuspoint: FocusPointData): void {
  const entityDataPath = path.resolve(__dirname, "../generated/entity-data.json");
  if (!fs.existsSync(entityDataPath)) return;

  try {
    const entityData = JSON.parse(fs.readFileSync(entityDataPath, "utf-8"));
    const entities = entityData.entities || [];

    // Build name→slug lookup
    const nameToSlug = new Map<string, string>();
    for (const e of entities) {
      nameToSlug.set(e.name.toLowerCase(), e.slug);
    }

    for (const ref of focuspoint.linkedEntities) {
      const slug = nameToSlug.get(ref.displayName.toLowerCase());
      if (slug) {
        ref.entitySlug = slug;
      }
    }
  } catch {
    // Ignore — entity data may not exist yet
  }
}

async function fetchFocusPoint(
  slug: string,
  pat: string
): Promise<FocusPointData | null> {
  const basePath = `${FOCUSPOINTS_PATH}/${slug}`;

  // Fetch plan.md (required)
  const planUrl = `${API_BASE}/${basePath}/plan.md`;
  const planContent = await fetchFileContent(planUrl, pat);
  if (!planContent) {
    console.warn(`  [SKIP] ${slug}: no plan.md`);
    return null;
  }

  const focuspoint = parsePlanMarkdown(planContent, slug);

  // Fetch optional bot data files
  const findingsContent = await fetchFileContent(
    `${API_BASE}/${basePath}/findings.md`,
    pat
  );
  if (findingsContent) {
    focuspoint.findings = parseFindingsMarkdown(findingsContent);
    focuspoint.hasBotData = true;
  }

  const timelineContent = await fetchFileContent(
    `${API_BASE}/${basePath}/timeline.md`,
    pat
  );
  if (timelineContent) {
    focuspoint.timeline = parseTimelineMarkdown(timelineContent);
    focuspoint.hasBotData = true;
  }

  const entitiesContent = await fetchFileContent(
    `${API_BASE}/${basePath}/entities.md`,
    pat
  );
  if (entitiesContent) {
    focuspoint.linkedEntities = parseEntitiesMarkdown(entitiesContent);
    focuspoint.hasBotData = true;
  }

  const sourcesContent = await fetchFileContent(
    `${API_BASE}/${basePath}/sources.md`,
    pat
  );
  if (sourcesContent) {
    focuspoint.sources = parseSourcesMarkdown(sourcesContent);
    focuspoint.hasBotData = true;
  }

  // List attachments
  const attachmentFiles = await listDirectory(`${basePath}/attachments`, pat);
  focuspoint.attachments = attachmentFiles
    .filter((f) => f.type === "file")
    .map(
      (f): FocusPointAttachment => ({
        filename: f.name,
        path: f.path,
        sizeBytes: f.size ?? 0,
      })
    );

  // Auto-upgrade status based on bot data
  if (focuspoint.hasBotData && focuspoint.status === "new") {
    focuspoint.status =
      focuspoint.findings.length > 0 ? "findings-available" : "investigating";
  }

  // Resolve entity references
  resolveEntityRefs(focuspoint);

  return focuspoint;
}

async function main() {
  // Check SKIP_FETCH
  if (process.env.SKIP_FETCH && fs.existsSync(OUTPUT_PATH)) {
    console.log("[SKIP] focuspoint-data.json already exists, skipping fetch.");
    return;
  }

  const pat = getGitHubPat();

  console.log("[START] Fetching FocusPoint data...\n");

  // List focuspoint directories
  const dirs = await listDirectory(FOCUSPOINTS_PATH, pat);
  const slugDirs = dirs.filter((d) => d.type === "dir");

  if (slugDirs.length === 0) {
    console.log("  No focuspoints found. Writing empty dataset.");
    const emptyDataset: FocusPointDataset = {
      focuspoints: [],
      totalFocusPoints: 0,
      generatedAt: new Date().toISOString(),
    };

    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(emptyDataset, null, 2), "utf-8");
    console.log(`[DONE] Generated empty focuspoint-data.json`);
    return;
  }

  console.log(`  Found ${slugDirs.length} focuspoint directories.`);

  const allFocusPoints: FocusPointData[] = [];

  for (const dir of slugDirs) {
    console.log(`  Processing ${dir.name}...`);
    const fp = await fetchFocusPoint(dir.name, pat);
    if (fp) {
      allFocusPoints.push(fp);
      console.log(
        `    [OK] ${fp.title} (status: ${fp.status}, bot data: ${fp.hasBotData})`
      );
    }
  }

  // Sort by createdAt descending
  allFocusPoints.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const dataset: FocusPointDataset = {
    focuspoints: allFocusPoints,
    totalFocusPoints: allFocusPoints.length,
    generatedAt: new Date().toISOString(),
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2), "utf-8");

  console.log(`\n[DONE] Generated focuspoint-data.json`);
  console.log(`  FocusPoints: ${allFocusPoints.length}`);
  console.log(`  With bot data: ${allFocusPoints.filter((fp) => fp.hasBotData).length}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
