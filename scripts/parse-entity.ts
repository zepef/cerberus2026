import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, Heading, ListItem } from "mdast";
import type {
  EntityData,
  EntityType,
  EntityStatus,
  EntityConnection,
  EntityCaseReference,
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

/**
 * Infer EntityStatus from a status text string.
 */
function inferEntityStatus(text: string): EntityStatus {
  const lower = text.toLowerCase().trim();
  if (lower.includes("convicted")) return "convicted";
  if (lower.includes("on trial") || lower.includes("on-trial")) return "on-trial";
  if (lower.includes("under investigation")) return "under-investigation";
  if (lower.includes("sanctioned")) return "sanctioned";
  if (lower.includes("exposed")) return "exposed";
  if (lower.includes("acquitted")) return "acquitted";
  if (lower.includes("active")) return "active";
  if (lower.includes("dissolved")) return "dissolved";
  return "unknown";
}

/**
 * Derive initials from a full name: first letter of first word + first letter of last word, uppercase.
 */
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Extract a metadata value from a paragraph text line that uses a **Bold:** prefix pattern.
 * Returns the value after the colon, or null if the marker is not present.
 */
function extractMetaValue(text: string, marker: string): string | null {
  // Match patterns like **Status:** value  or  **Status**: value
  const pattern = new RegExp(`\\*{0,2}${marker}:?\\*{0,2}\\s*(.+)`, "i");
  const match = text.match(pattern);
  if (match) return match[1].trim().replace(/\*+/g, "");
  return null;
}

/**
 * Parse a connection bullet item into an EntityConnection.
 * Expected formats:
 *   - **Name** — relationship description
 *   - **Name** - relationship description
 *   - Name — relationship description
 *   - Name - relationship description
 */
function parseConnectionItem(text: string): EntityConnection | null {
  // Try bold name pattern first: **Name** — relationship  or  **Name** - relationship
  const boldMatch = text.match(/^\*{2}(.+?)\*{2}\s*[—–\-]\s*(.+)$/);
  if (boldMatch) {
    return {
      targetSlug: "",
      targetName: boldMatch[1].trim(),
      relationship: boldMatch[2].trim(),
      resolved: false,
    };
  }

  // Try plain name pattern: Name — relationship  or  Name - relationship
  // Use em-dash/en-dash first since hyphens can appear in names
  const dashMatch = text.match(/^(.+?)\s*[—–]\s*(.+)$/);
  if (dashMatch) {
    return {
      targetSlug: "",
      targetName: dashMatch[1].trim().replace(/\*+/g, ""),
      relationship: dashMatch[2].trim(),
      resolved: false,
    };
  }

  // Fallback: split on " - " (space-hyphen-space to avoid splitting hyphenated names)
  const hyphenMatch = text.match(/^(.+?)\s+-\s+(.+)$/);
  if (hyphenMatch) {
    return {
      targetSlug: "",
      targetName: hyphenMatch[1].trim().replace(/\*+/g, ""),
      relationship: hyphenMatch[2].trim(),
      resolved: false,
    };
  }

  return null;
}

// Reusable type alias matching parse-markdown.ts pattern
type TextNode = {
  value?: string;
  children?: Array<{ value?: string; children?: Array<{ value?: string }> }>;
};

/**
 * Parse an entity markdown file into structured EntityData.
 *
 * Walks the mdast AST linearly (same pattern as parse-markdown.ts),
 * using section headings (H2) to drive a state machine.
 */
export function parseEntityMarkdown(
  markdown: string,
  type: EntityType,
  slug: string,
  countrySlug: string,
  countryName: string
): EntityData {
  const tree = unified().use(remarkParse).parse(markdown) as Root;

  let name = "";
  let status: EntityStatus = "unknown";
  let role: string | null = null;
  let party: string | null = null;
  let birthDate: string | null = null;
  const biography: string[] = [];
  const cases: EntityCaseReference[] = [];
  const connections: EntityConnection[] = [];
  const sources: string[] = [];

  // State machine
  let currentSection = ""; // lowercased H2 text
  let seenFirstH2 = false;
  let currentCaseRef: EntityCaseReference | null = null;

  const children = tree.children;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // --- H1: Extract entity name ---
    if (node.type === "heading" && (node as Heading).depth === 1) {
      name = getTextContent(node as unknown as TextNode).trim();
      continue;
    }

    // --- Metadata paragraphs before first H2 ---
    if (node.type === "paragraph" && !seenFirstH2) {
      const text = getTextContent(node as unknown as TextNode).trim();

      const statusVal = extractMetaValue(text, "Status");
      if (statusVal) {
        status = inferEntityStatus(statusVal);
        continue;
      }

      const roleVal = extractMetaValue(text, "Role");
      if (roleVal) {
        role = roleVal;
        continue;
      }

      const partyVal = extractMetaValue(text, "Party");
      if (partyVal) {
        party = partyVal;
        continue;
      }

      const bornVal = extractMetaValue(text, "Born");
      if (bornVal) {
        birthDate = bornVal;
        continue;
      }

      continue;
    }

    // --- H2: Section headings ---
    if (node.type === "heading" && (node as Heading).depth === 2) {
      seenFirstH2 = true;

      // Flush any pending case reference
      if (currentCaseRef) {
        cases.push(currentCaseRef);
        currentCaseRef = null;
      }

      currentSection = getTextContent(node as unknown as TextNode).trim().toLowerCase();
      continue;
    }

    // --- H3: Case sub-headings within "cases involved" ---
    if (node.type === "heading" && (node as Heading).depth === 3) {
      if (currentSection.includes("cases involved") || currentSection.includes("cases")) {
        // Flush previous case reference
        if (currentCaseRef) {
          cases.push(currentCaseRef);
        }

        const title = getTextContent(node as unknown as TextNode).trim();
        currentCaseRef = {
          title,
          countrySlug: null,
          description: null,
        };
      }
      continue;
    }

    // --- Paragraph content within sections ---
    if (node.type === "paragraph") {
      const text = getTextContent(node as unknown as TextNode).trim();
      if (!text) continue;

      // Biography section
      if (currentSection.includes("biography")) {
        biography.push(text);
        continue;
      }

      // Cases section — attach description to current case reference
      if (
        (currentSection.includes("cases involved") || currentSection.includes("cases")) &&
        currentCaseRef
      ) {
        if (currentCaseRef.description) {
          currentCaseRef.description += " " + text;
        } else {
          currentCaseRef.description = text;
        }
        continue;
      }
    }

    // --- List content within sections ---
    if (node.type === "list") {
      const listItems = (node as { children: ListItem[] }).children;

      // Key Associates / Connections section
      if (currentSection.includes("key associates") || currentSection.includes("connections")) {
        for (const item of listItems) {
          const text = getTextContent(item as unknown as TextNode).trim();
          if (!text) continue;
          const connection = parseConnectionItem(text);
          if (connection) {
            connections.push(connection);
          }
        }
        continue;
      }

      // Sources section
      if (currentSection.includes("sources")) {
        for (const item of listItems) {
          const text = getTextContent(item as unknown as TextNode).trim();
          if (text) sources.push(text);
        }
        continue;
      }

      // Cases section — collect list descriptions into current case
      if (
        (currentSection.includes("cases involved") || currentSection.includes("cases")) &&
        currentCaseRef
      ) {
        for (const item of listItems) {
          const text = getTextContent(item as unknown as TextNode).trim();
          if (text) {
            if (currentCaseRef.description) {
              currentCaseRef.description += " " + text;
            } else {
              currentCaseRef.description = text;
            }
          }
        }
        continue;
      }
    }
  }

  // Flush last case reference
  if (currentCaseRef) {
    cases.push(currentCaseRef);
  }

  return {
    slug,
    type,
    name,
    countrySlug,
    countryName,
    status,
    role,
    party,
    birthDate,
    biography,
    cases,
    connections,
    sources,
    initials: deriveInitials(name),
    imageUrl: null,
    rawMarkdown: markdown,
  };
}
