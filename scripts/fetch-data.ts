import * as fs from "fs";
import * as path from "path";
import { EU_COUNTRIES } from "../app/lib/constants";
import { parseCorruptionMarkdown } from "./parse-markdown";
import type { DashboardData, CountryData } from "../app/lib/types";

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const REPO_OWNER = "zepef";
const REPO_NAME = "botexchange";
const BASE_PATH = "cerberus/countries";
const CONCURRENCY = 5;
const OUTPUT_PATH = path.resolve(__dirname, "../generated/corruption-data.json");

async function ghFetch(url: string, pat: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "cerberus2026-dashboard",
    },
  });
}

async function fetchFileContent(
  slug: string,
  pat: string
): Promise<string | null> {
  const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BASE_PATH}/${slug}`;

  // Try corruption-news.md first
  try {
    let response = await ghFetch(`${apiBase}/corruption-news.md`, pat);

    // If not found, list directory and pick the first .md file that isn't README
    if (!response.ok) {
      const dirResponse = await ghFetch(apiBase, pat);
      if (!dirResponse.ok) {
        console.warn(`  [WARN] ${slug}: directory HTTP ${dirResponse.status}`);
        return null;
      }
      const files = (await dirResponse.json()) as Array<{ name: string; download_url: string }>;
      const mdFile = files.find(
        (f) => f.name.endsWith(".md") && f.name.toLowerCase() !== "readme.md"
      );
      if (!mdFile) {
        console.warn(`  [WARN] ${slug}: no markdown file found`);
        return null;
      }
      console.log(`  [INFO] ${slug}: using ${mdFile.name} (no corruption-news.md)`);
      response = await ghFetch(`${apiBase}/${mdFile.name}`, pat);
      if (!response.ok) {
        console.warn(`  [WARN] ${slug}: HTTP ${response.status} for ${mdFile.name}`);
        return null;
      }
    }

    const data = (await response.json()) as { content?: string; encoding?: string };
    if (!data.content) {
      console.warn(`  [WARN] ${slug}: No content field`);
      return null;
    }

    // Decode base64 content
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    // Strip emoji that could cause encoding issues
    return decoded.replace(/[\u{1F600}-\u{1F9FF}]/gu, "").trim();
  } catch (err) {
    console.error(`  [ERROR] ${slug}:`, err);
    return null;
  }
}

async function processBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }
  return results;
}

async function main() {
  // Check SKIP_FETCH
  if (process.env.SKIP_FETCH && fs.existsSync(OUTPUT_PATH)) {
    console.log("[SKIP] corruption-data.json already exists, skipping fetch.");
    return;
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat || pat === "your_github_personal_access_token_here") {
    console.error("[ERROR] GITHUB_PAT not set in environment. Set it in .env.local");
    process.exit(1);
  }

  console.log("[START] Fetching corruption data for 27 EU countries...\n");

  const slugs = Object.keys(EU_COUNTRIES);
  const countries: CountryData[] = [];
  let totalCases = 0;

  const results = await processBatch(
    slugs,
    CONCURRENCY,
    async (slug) => {
      const { name, isoA2 } = EU_COUNTRIES[slug];
      console.log(`  Fetching ${name} (${slug})...`);
      const markdown = await fetchFileContent(slug, pat);

      if (!markdown) {
        console.log(`  [SKIP] ${name}: no data`);
        return null;
      }

      const countryData = parseCorruptionMarkdown(markdown, slug, name, isoA2);
      console.log(`  [OK] ${name}: ${countryData.caseCount} cases`);
      return countryData;
    }
  );

  for (const result of results) {
    if (result) {
      countries.push(result);
      totalCases += result.caseCount;
    }
  }

  // Sort by case count descending
  countries.sort((a, b) => b.caseCount - a.caseCount);

  const dashboardData: DashboardData = {
    countries,
    totalCases,
    generatedAt: new Date().toISOString(),
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dashboardData, null, 2), "utf-8");

  console.log(`\n[DONE] Generated corruption-data.json`);
  console.log(`  Countries: ${countries.length}`);
  console.log(`  Total cases: ${totalCases}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
