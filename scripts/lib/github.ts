import * as fs from "fs";
import * as path from "path";

export const REPO_OWNER = "zepef";
export const REPO_NAME = "botexchange";

/**
 * Load environment variables from .env.local file.
 * Only sets variables that are not already present in process.env.
 *
 * @param rootDir - Directory containing .env.local. Defaults to the project root
 *                  (two levels up from scripts/lib/).
 */
export function loadEnv(
  rootDir: string = path.resolve(__dirname, "../..")
): void {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

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

/**
 * Returns the GITHUB_PAT from environment variables.
 * Throws an error if it is not set or is the placeholder value.
 */
export function getGitHubPat(): string {
  const pat = process.env.GITHUB_PAT;
  if (!pat || pat === "your_github_personal_access_token_here") {
    throw new Error(
      "GITHUB_PAT not set in environment. Set it in .env.local"
    );
  }
  return pat;
}

/**
 * Authenticated fetch wrapper for the GitHub API.
 */
export async function ghFetch(url: string, pat: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "cerberus2026-dashboard",
    },
  });
}

export interface BatchResult<R> {
  results: R[];
  succeeded: number;
  failed: number;
  errors: { index: number; reason: unknown }[];
}

/**
 * Process an array of items in batches with a given concurrency limit.
 * Returns results along with success/failure counts.
 */
export async function processBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<BatchResult<R>> {
  const results: R[] = [];
  let succeeded = 0;
  let failed = 0;
  const errors: { index: number; reason: unknown }[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        results.push(result.value);
        succeeded++;
      } else {
        failed++;
        errors.push({ index: i + j, reason: result.reason });
        console.error(`  [FAIL] Batch item ${i + j}:`, result.reason);
      }
    }
  }

  return { results, succeeded, failed, errors };
}

/**
 * Fetch a single file from the GitHub Contents API, decode its base64 body,
 * and strip emoji characters that could cause encoding issues.
 *
 * @param apiUrl - Full GitHub API URL for the file
 *                 (e.g. https://api.github.com/repos/owner/repo/contents/path/file.md)
 * @param pat    - GitHub personal access token
 * @returns The decoded file content, or null if the request fails or has no content.
 */
export async function fetchFileContent(
  apiUrl: string,
  pat: string
): Promise<string | null> {
  try {
    const response = await ghFetch(apiUrl, pat);
    if (!response.ok) {
      console.warn(`  [WARN] fetchFileContent: HTTP ${response.status} for ${apiUrl}`);
      return null;
    }

    const data = (await response.json()) as {
      content?: string;
      encoding?: string;
    };
    if (!data.content) {
      console.warn(`  [WARN] fetchFileContent: No content field in response for ${apiUrl}`);
      return null;
    }

    // Decode base64 content
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    // Strip emoji that could cause encoding issues (covers all common emoji blocks)
    return decoded.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "").trim();
  } catch (err) {
    console.error(`  [ERROR] fetchFileContent(${apiUrl}):`, err);
    return null;
  }
}
