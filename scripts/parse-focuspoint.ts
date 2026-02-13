import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, Heading, ListItem } from "mdast";
import type {
  FocusPointData,
  FocusPointStatus,
  FocusPointFinding,
  FocusPointTimelineEntry,
  FocusPointEntityRef,
} from "../app/lib/types";

/**
 * Recursively extract plain text from an mdast node.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTextContent(node: any): string {
  if (typeof node.value === "string") return node.value;
  let text = "";
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      text += getTextContent(child);
    }
  }
  return text;
}

/**
 * Extract a metadata value from a **Bold:** prefix pattern.
 */
function extractMetaValue(text: string, marker: string): string | null {
  const pattern = new RegExp(`\\*{0,2}${marker}:?\\*{0,2}\\s*(.+)`, "i");
  const match = text.match(pattern);
  if (match) return match[1].trim().replace(/\*+/g, "");
  return null;
}

/**
 * Infer FocusPointStatus from a text string.
 */
function inferStatus(text: string): FocusPointStatus {
  const lower = text.toLowerCase().trim();
  if (lower.includes("completed")) return "completed";
  if (lower.includes("findings")) return "findings-available";
  if (lower.includes("investigating")) return "investigating";
  if (lower.includes("stale")) return "stale";
  return "new";
}

/**
 * Parse a plan.md file into partial FocusPointData.
 */
export function parsePlanMarkdown(
  markdown: string,
  slug: string
): FocusPointData {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;

  let title = "";
  let status: FocusPointStatus = "new";
  let createdAt = "";
  let submittedBy = "Anonymous";
  const description: string[] = [];
  const links: string[] = [];
  const attachmentNames: string[] = [];
  const searchDirectives: string[] = [];

  let currentSection = "";
  let seenFirstH2 = false;

  const children = tree.children;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // H1: Title
    if (node.type === "heading" && (node as Heading).depth === 1) {
      title = getTextContent(node).trim();
      continue;
    }

    // Metadata paragraphs before first H2
    if (node.type === "paragraph" && !seenFirstH2) {
      const text = getTextContent(node).trim();

      const statusVal = extractMetaValue(text, "Status");
      if (statusVal) { status = inferStatus(statusVal); continue; }

      const createdVal = extractMetaValue(text, "Created");
      if (createdVal) { createdAt = createdVal; continue; }

      const byVal = extractMetaValue(text, "Submitted By");
      if (byVal) { submittedBy = byVal; continue; }

      continue;
    }

    // H2: Section headings
    if (node.type === "heading" && (node as Heading).depth === 2) {
      seenFirstH2 = true;
      currentSection = getTextContent(node).trim().toLowerCase();
      continue;
    }

    // Paragraph content
    if (node.type === "paragraph") {
      const text = getTextContent(node).trim();
      if (!text) continue;

      if (currentSection.includes("description")) {
        description.push(text);
      }
      continue;
    }

    // List content
    if (node.type === "list") {
      const listItems = (node as { children: ListItem[] }).children;

      if (currentSection.includes("links") || currentSection.includes("sources")) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (text) links.push(text);
        }
        continue;
      }

      if (currentSection.includes("attachments")) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (text) attachmentNames.push(text);
        }
        continue;
      }

      if (currentSection.includes("search directives")) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (text) searchDirectives.push(text);
        }
        continue;
      }

      // Description section lists
      if (currentSection.includes("description")) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (text) description.push(text);
        }
        continue;
      }
    }
  }

  return {
    slug,
    title,
    status,
    createdAt,
    submittedBy,
    description,
    links,
    attachments: [],
    searchDirectives,
    findings: [],
    timeline: [],
    linkedEntities: [],
    sources: [],
    rawPlanMarkdown: markdown,
    hasBotData: false,
  };
}

/**
 * Parse findings.md into FocusPointFinding[].
 * Format: H2/H3 = finding title, paragraphs = summary, lists = sources.
 */
export function parseFindingsMarkdown(markdown: string): FocusPointFinding[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const findings: FocusPointFinding[] = [];
  let current: FocusPointFinding | null = null;

  for (const node of tree.children) {
    if (
      node.type === "heading" &&
      ((node as Heading).depth === 2 || (node as Heading).depth === 3)
    ) {
      if (current) findings.push(current);
      const text = getTextContent(node).trim();
      // Try to extract date from heading: "Finding Title (2026-01-15)"
      const dateMatch = text.match(/\((\d{4}-\d{2}-\d{2})\)/);
      current = {
        title: text.replace(/\s*\(\d{4}-\d{2}-\d{2}\)/, "").trim(),
        date: dateMatch ? dateMatch[1] : null,
        summary: [],
        sources: [],
        relevance: null,
      };
      continue;
    }

    if (!current) continue;

    if (node.type === "paragraph") {
      const text = getTextContent(node).trim();
      if (!text) continue;
      const relVal = extractMetaValue(text, "Relevance");
      if (relVal) {
        current.relevance = relVal;
      } else {
        current.summary.push(text);
      }
      continue;
    }

    if (node.type === "list") {
      const listItems = (node as { children: ListItem[] }).children;
      for (const item of listItems) {
        const text = getTextContent(item).trim();
        if (text) current.sources.push(text);
      }
    }
  }

  if (current) findings.push(current);
  return findings;
}

/**
 * Parse timeline.md into FocusPointTimelineEntry[].
 * Format: list items with "YYYY-MM-DD: event" or "YYYY-MM-DD: event (source)"
 */
export function parseTimelineMarkdown(markdown: string): FocusPointTimelineEntry[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const entries: FocusPointTimelineEntry[] = [];

  for (const node of tree.children) {
    if (node.type === "list") {
      const listItems = (node as { children: ListItem[] }).children;
      for (const item of listItems) {
        const text = getTextContent(item).trim();
        const match = text.match(/^(\d{4}-\d{2}-\d{2}):\s*(.+)$/);
        if (match) {
          const event = match[2];
          // Check for source in parentheses at end
          const sourceMatch = event.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          entries.push({
            date: match[1],
            event: sourceMatch ? sourceMatch[1].trim() : event.trim(),
            source: sourceMatch ? sourceMatch[2].trim() : null,
          });
        }
      }
    }
  }

  return entries;
}

/**
 * Parse entities.md into FocusPointEntityRef[].
 * Format: **Name** — role  or  **Name** - role
 */
export function parseEntitiesMarkdown(markdown: string): FocusPointEntityRef[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const refs: FocusPointEntityRef[] = [];

  for (const node of tree.children) {
    if (node.type === "list") {
      const listItems = (node as { children: ListItem[] }).children;
      for (const item of listItems) {
        const text = getTextContent(item).trim();
        // **Name** — role
        const boldMatch = text.match(/^\*{2}(.+?)\*{2}\s*[—–\-]\s*(.+)$/);
        if (boldMatch) {
          refs.push({
            displayName: boldMatch[1].trim(),
            entitySlug: null,
            role: boldMatch[2].trim(),
          });
          continue;
        }
        // Plain name
        if (text) {
          refs.push({
            displayName: text.replace(/\*+/g, "").trim(),
            entitySlug: null,
            role: null,
          });
        }
      }
    }
  }

  return refs;
}

/**
 * Parse sources.md into string[].
 */
export function parseSourcesMarkdown(markdown: string): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const sources: string[] = [];

  for (const node of tree.children) {
    if (node.type === "list") {
      const listItems = (node as { children: ListItem[] }).children;
      for (const item of listItems) {
        const text = getTextContent(item).trim();
        if (text) sources.push(text);
      }
    }
  }

  return sources;
}
