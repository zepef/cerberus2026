import { REPO_OWNER, REPO_NAME } from "./github";

/**
 * PUT a file to the GitHub Contents API (create or update).
 */
export async function ghPutFile(
  pat: string,
  owner: string,
  repo: string,
  filePath: string,
  base64Content: string,
  commitMessage: string
): Promise<{ success: boolean; path: string; sha?: string }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "cerberus2026-dashboard",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: commitMessage,
      content: base64Content,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub PUT failed (${response.status}): ${err}`);
  }

  const data = (await response.json()) as { content?: { path?: string; sha?: string } };
  return {
    success: true,
    path: data.content?.path ?? filePath,
    sha: data.content?.sha,
  };
}

/**
 * Generate a URL-safe slug from a title with a timestamp suffix for uniqueness.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}

/**
 * Generate a plan.md markdown file from user submission data.
 */
export function generatePlanMarkdown(data: {
  title: string;
  description: string;
  links: string[];
  attachmentFilenames: string[];
}): string {
  const now = new Date().toISOString();
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push("");
  lines.push("**Status:** New");
  lines.push(`**Created:** ${now}`);
  lines.push("**Submitted By:** Anonymous");
  lines.push("");

  lines.push("## Description");
  lines.push(data.description);
  lines.push("");

  if (data.links.length > 0) {
    lines.push("## Links & Sources");
    for (const link of data.links) {
      lines.push(`- ${link}`);
    }
    lines.push("");
  }

  if (data.attachmentFilenames.length > 0) {
    lines.push("## Attachments");
    for (const filename of data.attachmentFilenames) {
      lines.push(`- ${filename}`);
    }
    lines.push("");
  }

  lines.push("## Search Directives");
  lines.push(`- Investigate: ${data.title}`);
  if (data.links.length > 0) {
    lines.push(`- Monitor sources: ${data.links.join(", ")}`);
  }
  lines.push("");

  return lines.join("\n");
}

export { REPO_OWNER, REPO_NAME };
