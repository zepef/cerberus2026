import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import type { Root, Heading, Text, Strong, Link, ListItem } from "mdast";
import type { CorruptionCase, CaseStatus, CountryData } from "../app/lib/types";

// Sections to skip when extracting cases
const SKIP_SECTIONS = new Set([
  "sources",
  "key entities",
  "key statistics",
  "context",
  "structural concerns",
  "monitoring notes",
  "general status",
  "current status",
  "transparency international ranking",
  "ti ranking",
  "known concerns",
  "key strengths",
  "historical context",
  "documentation sources",
  "key figures",
  "key institutions",
  "political landscape",
  "positive developments",
  "media landscape",
  "monitoring priority",
  "risk areas",
  "structural risk factors",
]);

function getTextContent(node: { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }): string {
  let text = "";
  if ("value" in node && typeof (node as { value?: string }).value === "string") return (node as { value: string }).value;
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

function inferStatus(text: string): CaseStatus {
  const lower = text.toLowerCase();
  if (lower.includes("ongoing") || lower.includes("active") || lower.includes("pending") || lower.includes("open")) return "ongoing";
  if (lower.includes("convicted") || lower.includes("conviction") || lower.includes("sentenced") || lower.includes("guilty")) return "convicted";
  if (lower.includes("investigation") || lower.includes("investigating") || lower.includes("under investigation") || lower.includes("indicted")) return "investigation";
  if (lower.includes("exposed") || lower.includes("revealed") || lower.includes("uncovered") || lower.includes("leaked")) return "exposed";
  if (lower.includes("resolved") || lower.includes("concluded") || lower.includes("closed") || lower.includes("settled")) return "resolved";
  if (lower.includes("acquitted") || lower.includes("dismissed") || lower.includes("dropped")) return "acquitted";
  return "unknown";
}

function extractDateRange(text: string): string | null {
  // Match patterns like "2021", "2020-2024", "September 2021", etc.
  const datePatterns = [
    /\b(\d{4})\s*[-–]\s*(\d{4})\b/,
    /\b(\d{4})\s*[-–]\s*present\b/i,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i,
    /\b(20\d{2}|19\d{2})\b/,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseCorruptionMarkdown(
  markdown: string,
  slug: string,
  countryName: string,
  isoA2: string
): CountryData {
  const tree = unified().use(remarkParse).parse(markdown) as Root;

  let lastUpdated: string | null = null;
  let filedBy: string | null = null;
  let context: string | null = null;
  let tiRanking: string | null = null;
  const cases: CorruptionCase[] = [];
  const sections: string[] = [];
  const sources: string[] = [];
  const keyEntities: string[] = [];

  // State machine for tree walk
  let currentH2 = "";
  let currentH2IsCase = false;
  let currentCase: CorruptionCase | null = null;
  let inSourcesSection = false;
  let inEntitiesSection = false;
  let inContextSection = false;
  let seenFirstH2 = false;
  const contextParts: string[] = [];

  const children = tree.children;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // Extract metadata from first paragraph (before any H2)
    if (node.type === "paragraph" && !seenFirstH2) {
      const text = getTextContent(node as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> });

      // Check for Last updated
      const updatedMatch = text.match(/\*?\*?Last updated:?\*?\*?\s*(.+)/i);
      if (updatedMatch) {
        lastUpdated = updatedMatch[1].trim().replace(/\*+/g, "");
      }

      // Check for Filed by
      const filedMatch = text.match(/\*?\*?Filed by:?\*?\*?\s*(.+)/i);
      if (filedMatch) {
        filedBy = filedMatch[1].trim().replace(/\*+/g, "");
      }

      // Check for TI ranking
      const tiMatch = text.match(/Transparency International.*?rank.*?(\d+)/i);
      if (tiMatch) {
        tiRanking = tiMatch[0];
      }

      // Collect context from intro paragraphs
      if (!updatedMatch && !filedMatch) {
        contextParts.push(text);
      }
    }

    // H2: Section headings
    if (node.type === "heading" && (node as Heading).depth === 2) {
      seenFirstH2 = true;
      // Flush current case
      if (currentCase) {
        cases.push(currentCase);
        currentCase = null;
      }

      currentH2 = getTextContent(node as unknown as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }).trim();
      const h2Lower = currentH2.toLowerCase();

      inSourcesSection = h2Lower.includes("source");
      inEntitiesSection = h2Lower.includes("key entit") || h2Lower.includes("key figure");
      inContextSection = h2Lower.includes("context") || h2Lower.includes("structural");

      currentH2IsCase = !SKIP_SECTIONS.has(h2Lower) && !inSourcesSection && !inEntitiesSection && !inContextSection;

      if (currentH2IsCase && !sections.includes(currentH2)) {
        sections.push(currentH2);
      }
    }

    // H3: Individual cases within case sections
    if (node.type === "heading" && (node as Heading).depth === 3) {
      // Flush previous case
      if (currentCase) {
        cases.push(currentCase);
      }

      const title = getTextContent(node as unknown as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }).trim();

      if (currentH2IsCase) {
        const dateRange = extractDateRange(title);
        currentCase = {
          id: slugify(title).slice(0, 60),
          title: title.replace(/\*+/g, "").trim(),
          status: "unknown",
          dateRange,
          description: [],
          section: currentH2,
        };
      } else {
        currentCase = null;
      }
    }

    // Paragraphs & lists within case sections
    if (currentCase && (node.type === "paragraph" || node.type === "list")) {
      if (node.type === "paragraph") {
        const text = getTextContent(node as unknown as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }).trim();

        // Check for status marker
        const statusMatch = text.match(/\*?\*?Status:?\*?\*?\s*(.+)/i);
        if (statusMatch) {
          currentCase.status = inferStatus(statusMatch[1]);
          if (currentCase.status === "unknown") {
            currentCase.description.push(text);
          }
        }

        // Check for date marker
        const dateMatch = text.match(/\*?\*?Date:?\*?\*?\s*(.+)/i);
        if (dateMatch && !currentCase.dateRange) {
          currentCase.dateRange = dateMatch[1].trim().replace(/\*+/g, "");
        }

        if (!statusMatch && !dateMatch) {
          currentCase.description.push(text);
        }

        // Try to infer status from description text if still unknown
        if (currentCase.status === "unknown") {
          currentCase.status = inferStatus(text);
        }
      }

      if (node.type === "list") {
        for (const item of (node as { children: ListItem[] }).children) {
          const text = getTextContent(item as unknown as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }).trim();
          if (text) {
            currentCase.description.push(text);
            // Infer status from list items too
            if (currentCase.status === "unknown") {
              currentCase.status = inferStatus(text);
            }
          }
        }
      }
    }

    // Sources section: collect list items
    if (inSourcesSection && node.type === "list") {
      for (const item of (node as { children: ListItem[] }).children) {
        const text = getTextContent(item as unknown as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }).trim();
        if (text) sources.push(text);
      }
    }

    // Key Entities section: collect list items
    if (inEntitiesSection && node.type === "list") {
      for (const item of (node as { children: ListItem[] }).children) {
        const text = getTextContent(item as unknown as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }).trim();
        if (text) keyEntities.push(text);
      }
    }

    // Context section content
    if (inContextSection && node.type === "paragraph") {
      const text = getTextContent(node as unknown as { children?: Array<{ value?: string; children?: Array<{ value?: string }> }> }).trim();
      if (text) contextParts.push(text);
    }
  }

  // Flush last case
  if (currentCase) {
    cases.push(currentCase);
  }

  context = contextParts.length > 0 ? contextParts.join(" ") : null;

  // Try to extract TI ranking from full text if not found yet
  if (!tiRanking) {
    const tiMatch = markdown.match(/Transparency International.*?rank.*?(\d+)/i);
    if (tiMatch) tiRanking = tiMatch[0];
  }

  return {
    slug,
    name: countryName,
    isoA2,
    lastUpdated,
    filedBy,
    context,
    cases,
    caseCount: cases.length,
    sections,
    sources,
    keyEntities,
    tiRanking,
    rawMarkdown: markdown,
  };
}
