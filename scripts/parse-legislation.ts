import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, Heading, ListItem } from "mdast";
import type {
  LegislationEntry,
  LegislationStatus,
  LegislationImpact,
  LinkedEntityRef,
  CountryLegislation,
} from "../app/lib/types";

/**
 * Recursively extract plain text from an mdast node and its children.
 */
function getTextContent(node: {
  value?: string;
  children?: Array<{ value?: string; children?: Array<{ value?: string }> }>;
}): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  let text = "";
  if (node.children) {
    for (const child of node.children) {
      if ("value" in child && typeof child.value === "string") {
        text += child.value;
      } else if ("children" in child && child.children) {
        for (const grandchild of child.children) {
          if ("value" in grandchild && typeof grandchild.value === "string") {
            text += grandchild.value;
          }
        }
      }
    }
  }
  return text;
}

// Reusable type alias matching parse-entity.ts pattern
type TextNode = {
  value?: string;
  children?: Array<{ value?: string; children?: Array<{ value?: string }> }>;
};

/**
 * Extract a metadata value from a paragraph text line that uses a **Bold:** prefix pattern.
 */
function extractMetaValue(text: string, marker: string): string | null {
  const pattern = new RegExp(`\\*{0,2}${marker}:?\\*{0,2}\\s*(.+)`, "i");
  const match = text.match(pattern);
  if (match) return match[1].trim().replace(/\*+/g, "");
  return null;
}

/**
 * Infer LegislationStatus from a status text string.
 */
export function inferLegislationStatus(text: string): LegislationStatus {
  const lower = text.toLowerCase().trim();
  if (lower.includes("enacted") || lower.includes("passed") || lower.includes("in force"))
    return "enacted";
  if (lower.includes("proposed") || lower.includes("draft") || lower.includes("pending"))
    return "proposed";
  if (lower.includes("committee") || lower.includes("in-committee") || lower.includes("review"))
    return "in-committee";
  if (lower.includes("vetoed") || lower.includes("rejected")) return "vetoed";
  if (lower.includes("repealed") || lower.includes("revoked")) return "repealed";
  if (lower.includes("amended") || lower.includes("modified")) return "amended";
  if (lower.includes("stalled") || lower.includes("delayed") || lower.includes("suspended"))
    return "stalled";
  return "proposed";
}

/**
 * Infer LegislationImpact from an impact text string.
 */
export function inferImpact(text: string): LegislationImpact {
  const lower = text.toLowerCase().trim();
  if (lower.includes("high") || lower.includes("major") || lower.includes("significant"))
    return "high";
  if (lower.includes("low") || lower.includes("minor") || lower.includes("minimal"))
    return "low";
  return "medium";
}

/**
 * Parse a comma-separated sectors string into an array.
 */
export function parseSectors(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse linked entities string into LinkedEntityRef[].
 * Expected formats: "Name1, Name2" or "Name1; Name2"
 */
export function parseLinkedEntities(text: string): LinkedEntityRef[] {
  return text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({
      displayName: name.replace(/\*+/g, ""),
      entitySlug: null,
    }));
}

/**
 * Generate a stable slug ID for a legislation entry.
 */
function generateEntryId(countrySlug: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${countrySlug}/${slug}`;
}

/**
 * Parse a legislative-changes markdown file into structured CountryLegislation.
 *
 * Walks the mdast AST linearly (same pattern as parse-entity.ts),
 * using H2 for category headings and H3 for individual entries.
 */
export function parseLegislationMarkdown(
  markdown: string,
  countrySlug: string,
  countryName: string,
  isoA2: string
): CountryLegislation {
  const tree = unified().use(remarkParse).parse(markdown) as Root;

  let lastUpdated: string | null = null;
  let filedBy: string | null = null;
  const categories: string[] = [];
  const entries: LegislationEntry[] = [];

  // State machine
  let currentCategory = "";
  let seenFirstH2 = false;
  let currentEntry: LegislationEntry | null = null;
  let inMetadata = false;

  const children = tree.children;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // --- Metadata paragraphs before first H2 ---
    if (node.type === "paragraph" && !seenFirstH2) {
      const text = getTextContent(node as unknown as TextNode).trim();

      const updatedVal = extractMetaValue(text, "Last updated");
      if (updatedVal) {
        lastUpdated = updatedVal;
        continue;
      }

      const filedVal = extractMetaValue(text, "Filed by");
      if (filedVal) {
        filedBy = filedVal;
        continue;
      }

      continue;
    }

    // --- H2: Category headings ---
    if (node.type === "heading" && (node as Heading).depth === 2) {
      seenFirstH2 = true;

      // Flush pending entry
      if (currentEntry) {
        entries.push(currentEntry);
        currentEntry = null;
      }

      currentCategory = getTextContent(node as unknown as TextNode).trim();
      if (currentCategory && !categories.includes(currentCategory)) {
        categories.push(currentCategory);
      }
      inMetadata = false;
      continue;
    }

    // --- H3: Individual legislation entries ---
    if (node.type === "heading" && (node as Heading).depth === 3) {
      // Flush previous entry
      if (currentEntry) {
        entries.push(currentEntry);
      }

      const title = getTextContent(node as unknown as TextNode).trim();
      currentEntry = {
        id: generateEntryId(countrySlug, title),
        title,
        status: "proposed",
        date: null,
        sectors: [],
        impact: "medium",
        linkedEntities: [],
        description: [],
        sources: [],
        category: currentCategory,
      };
      inMetadata = true;
      continue;
    }

    // --- Paragraph content ---
    if (node.type === "paragraph" && currentEntry) {
      const text = getTextContent(node as unknown as TextNode).trim();
      if (!text) continue;

      // Try to extract metadata fields
      if (inMetadata) {
        const statusVal = extractMetaValue(text, "Status");
        if (statusVal) {
          currentEntry.status = inferLegislationStatus(statusVal);
          continue;
        }

        const dateVal = extractMetaValue(text, "Date");
        if (dateVal) {
          currentEntry.date = dateVal;
          continue;
        }

        const sectorsVal = extractMetaValue(text, "Sectors");
        if (sectorsVal) {
          currentEntry.sectors = parseSectors(sectorsVal);
          continue;
        }

        const impactVal = extractMetaValue(text, "Impact");
        if (impactVal) {
          currentEntry.impact = inferImpact(impactVal);
          continue;
        }

        const entitiesVal = extractMetaValue(text, "Linked entities");
        if (entitiesVal) {
          currentEntry.linkedEntities = parseLinkedEntities(entitiesVal);
          continue;
        }

        // If we see a paragraph without a metadata marker, we've exited metadata
        inMetadata = false;
      }

      // Regular description paragraph
      currentEntry.description.push(text);
      continue;
    }

    // --- List content ---
    if (node.type === "list" && currentEntry) {
      const listItems = (node as { children: ListItem[] }).children;

      for (const item of listItems) {
        const text = getTextContent(item as unknown as TextNode).trim();
        if (!text) continue;

        // Source items
        if (text.toLowerCase().startsWith("source:")) {
          currentEntry.sources.push(text.replace(/^source:\s*/i, "").trim());
        } else {
          // Treat non-source list items as additional description
          currentEntry.description.push(text);
        }
      }
      continue;
    }
  }

  // Flush last entry
  if (currentEntry) {
    entries.push(currentEntry);
  }

  return {
    countrySlug,
    countryName,
    isoA2,
    lastUpdated,
    filedBy,
    categories,
    entries,
    entryCount: entries.length,
  };
}
