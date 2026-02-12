import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
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


/**
 * Parse a cross-reference path like "austria/entities/individuals/schmid-thomas.md"
 * into an EntityConnection with the correct slug format.
 */
function parseCrossRefPath(refPath: string): EntityConnection | null {
  // Match patterns: country/entities/type/name.md
  const match = refPath.match(/entities\/(\w[\w-]*)\/(\w[\w-]*)\.md/);
  if (!match) return null;

  const dirName = match[1]; // e.g., "individuals"
  const fileName = match[2]; // e.g., "schmid-thomas"

  // Map directory to entity type slug prefix
  const typeMap: Record<string, string> = {
    individuals: "individual",
    companies: "company",
    "foreign-states": "foreign-state",
    organizations: "organization",
  };
  const typePrefix = typeMap[dirName];
  if (!typePrefix) return null;

  const targetSlug = `${typePrefix}/${fileName}`;
  // Convert slug to display name: "schmid-thomas" → "Schmid Thomas"
  const displayName = fileName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    targetSlug,
    targetName: displayName,
    relationship: "cross-referenced",
    resolved: true, // We know the slug directly
  };
}

/** Check if a section heading indicates biographical content */
function isBioSection(section: string): boolean {
  return (
    section.includes("biography") ||
    section === "profile" ||
    section === "overview" ||
    section.includes("early life") ||
    section.includes("political career") ||
    section.includes("post-politics") ||
    section.includes("family")
  );
}

/** Check if a section heading indicates case/scandal content */
function isCaseSection(section: string): boolean {
  return (
    section.includes("cases") ||
    section.includes("criminal") ||
    section.includes("scandal") ||
    section.includes("allegations") ||
    section.includes("controversies") ||
    section.includes("corruption") ||
    section.includes("charges") ||
    section.includes("convictions") ||
    section.includes("downfall") ||
    section.includes("money laundering")
  );
}

/** Check if a section heading indicates connections/associates */
function isConnectionSection(section: string): boolean {
  return (
    section.includes("key associates") ||
    section.includes("connection") ||
    section.includes("key actors") ||
    section.includes("key entities") ||
    section.includes("business connections") ||
    section.includes("cross-references") ||
    section.includes("family & network") ||
    section.includes("international connections")
  );
}

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
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;

  let name = "";
  let status: EntityStatus = "unknown";
  let role: string | null = null;
  let party: string | null = null;
  let birthDate: string | null = null;
  let profileTitle: string | null = null;
  let profileSummary: string | null = null;
  let whyTracked: string | null = null;
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
      name = getTextContent(node).trim();
      continue;
    }

    // --- Metadata paragraphs before first H2 ---
    if (node.type === "paragraph" && !seenFirstH2) {
      const text = getTextContent(node).trim();

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

      currentSection = getTextContent(node).trim().toLowerCase();
      continue;
    }

    // --- H3: Sub-headings ---
    if (node.type === "heading" && (node as Heading).depth === 3) {
      const h3Text = getTextContent(node).trim();

      if (isCaseSection(currentSection)) {
        // Flush previous case reference
        if (currentCaseRef) {
          cases.push(currentCaseRef);
        }
        currentCaseRef = {
          title: h3Text,
          countrySlug: null,
          description: null,
        };
      } else if (isBioSection(currentSection)) {
        // Add H3 heading as a biography line
        biography.push(h3Text);
      }
      continue;
    }

    // --- Paragraph content within sections ---
    if (node.type === "paragraph") {
      const text = getTextContent(node).trim();
      if (!text) continue;

      // CERBERUS Summary section — extract title, description, why tracked
      // These may be on separate lines within a single mdast paragraph
      if (currentSection.includes("cerberus summary")) {
        const titleVal = extractMetaValue(text, "Title");
        if (titleVal) profileTitle = titleVal.replace(/\s*(Description|Why tracked):[\s\S]*$/i, "").trim();
        const descVal = extractMetaValue(text, "Description");
        if (descVal) profileSummary = descVal.replace(/\s*(Title|Why tracked):[\s\S]*$/i, "").trim();
        const whyVal = extractMetaValue(text, "Why tracked");
        if (whyVal) whyTracked = whyVal.trim();
        continue;
      }

      // Basic Info section — extract metadata that may have moved here
      if (currentSection === "basic info") {
        const statusVal = extractMetaValue(text, "Status");
        if (statusVal) { status = inferEntityStatus(statusVal); continue; }
        const roleVal = extractMetaValue(text, "Role");
        if (roleVal) { role = roleVal; continue; }
        const partyVal = extractMetaValue(text, "Party");
        if (partyVal) { party = partyVal; continue; }
        const bornVal = extractMetaValue(text, "Born");
        if (bornVal) { birthDate = bornVal; continue; }
        const countryVal = extractMetaValue(text, "Country");
        if (countryVal) continue; // skip, we already know the country
        continue;
      }

      // Biography / Profile / Overview section
      if (isBioSection(currentSection)) {
        biography.push(text);
        continue;
      }

      // Cases section — attach description to current case reference
      if (isCaseSection(currentSection) && currentCaseRef) {
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

      // Key Associates / Connections / Key Actors / Key Entities / Cross-References
      if (isConnectionSection(currentSection)) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (!text) continue;
          // Try standard connection format: **Name** — relationship
          const connection = parseConnectionItem(text);
          if (connection) {
            connections.push(connection);
            continue;
          }
          // Parse cross-ref paths: "See: country/entities/type/name.md"
          const seeMatch = text.match(/See:\s*`?([^`]+)`?/i);
          if (seeMatch) {
            const refPath = seeMatch[1].trim();
            const conn = parseCrossRefPath(refPath);
            if (conn) connections.push(conn);
          }
        }
        continue;
      }

      // Basic Info section — extract metadata from list items
      if (currentSection === "basic info") {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (!text) continue;
          const statusVal = extractMetaValue(text, "Status");
          if (statusVal) { status = inferEntityStatus(statusVal); continue; }
          const roleVal = extractMetaValue(text, "Role");
          if (roleVal) { role = roleVal; continue; }
          const partyVal = extractMetaValue(text, "Party");
          if (partyVal) { party = partyVal; continue; }
          const bornVal = extractMetaValue(text, "Born");
          if (bornVal) { birthDate = bornVal; continue; }
        }
        continue;
      }

      // Sources section
      if (currentSection.includes("sources") || currentSection.includes("key documents")) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (text) sources.push(text);
        }
        continue;
      }

      // Cases section — collect list descriptions into current case
      if (isCaseSection(currentSection) && currentCaseRef) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
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

      // Biography / Profile / Overview — capture list items as bio lines
      if (isBioSection(currentSection)) {
        for (const item of listItems) {
          const text = getTextContent(item).trim();
          if (text) biography.push(text);
        }
        continue;
      }

    }

    // --- Table content (e.g., case tables) ---
    if (node.type === "table" && isCaseSection(currentSection)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (node as any).children;
      // Skip header row (index 0), parse data rows
      for (let r = 1; r < rows.length; r++) {
        const cells = rows[r].children;
        if (!cells || cells.length === 0) continue;
        const caseTitle = getTextContent(cells[0]).trim();
        const caseDesc = cells.length > 1 ? getTextContent(cells[1]).trim() : null;
        const caseStatus = cells.length > 2 ? getTextContent(cells[2]).trim() : null;
        if (caseTitle) {
          cases.push({
            title: caseTitle,
            countrySlug: null,
            description: [caseDesc, caseStatus].filter(Boolean).join(" — ") || null,
          });
        }
      }
      continue;
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
    profileTitle,
    profileSummary,
    whyTracked,
    rawMarkdown: markdown,
  };
}
