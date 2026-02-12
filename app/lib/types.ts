export type CaseStatus =
  | "ongoing"
  | "convicted"
  | "investigation"
  | "exposed"
  | "resolved"
  | "acquitted"
  | "unknown";

export interface CorruptionCase {
  id: string;
  title: string;
  status: CaseStatus;
  dateRange: string | null;
  description: string[];
  section: string;
}

export interface CountryData {
  slug: string;
  name: string;
  isoA2: string;
  lastUpdated: string | null;
  filedBy: string | null;
  context: string | null;
  cases: CorruptionCase[];
  caseCount: number;
  sections: string[];
  sources: string[];
  keyEntities: string[];
  tiRanking: string | null;
  rawMarkdown: string;
}

export interface DashboardData {
  countries: CountryData[];
  totalCases: number;
  generatedAt: string;
}

export interface CountrySummary {
  slug: string;
  name: string;
  isoA2: string;
  caseCount: number;
}

export type EntityType = "individual" | "company" | "foreign-state" | "organization";

export type EntityStatus =
  | "convicted"
  | "on-trial"
  | "under-investigation"
  | "sanctioned"
  | "exposed"
  | "acquitted"
  | "active"
  | "dissolved"
  | "unknown";

export interface EntityConnection {
  targetSlug: string;
  targetName: string;
  relationship: string;
  resolved: boolean;
}

export interface EntityCaseReference {
  title: string;
  countrySlug: string | null;
  description: string | null;
}

export interface EntityData {
  slug: string;
  type: EntityType;
  name: string;
  countrySlug: string;
  countryName: string;
  status: EntityStatus;
  role: string | null;
  party: string | null;
  birthDate: string | null;
  biography: string[];
  cases: EntityCaseReference[];
  connections: EntityConnection[];
  sources: string[];
  initials: string;
  imageUrl: string | null;
  rawMarkdown: string;
}

export interface EntitySummary {
  slug: string;
  type: EntityType;
  name: string;
  countrySlug: string;
  countryName: string;
  status: EntityStatus;
  role: string | null;
  initials: string;
  imageUrl: string | null;
  connectionCount: number;
  caseCount: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  countrySlug: string;
  initials: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface EntityDataset {
  entities: EntityData[];
  totalEntities: number;
  graphData: GraphData;
  generatedAt: string;
}

// --- Legislation types ---

export type LegislationStatus =
  | "enacted"
  | "proposed"
  | "in-committee"
  | "vetoed"
  | "repealed"
  | "amended"
  | "stalled";

export type LegislationImpact = "high" | "medium" | "low";

export interface LinkedEntityRef {
  displayName: string;
  entitySlug: string | null;
}

export interface LegislationEntry {
  id: string;
  title: string;
  status: LegislationStatus;
  date: string | null;
  sectors: string[];
  impact: LegislationImpact;
  linkedEntities: LinkedEntityRef[];
  description: string[];
  sources: string[];
  category: string;
}

export interface CountryLegislation {
  countrySlug: string;
  countryName: string;
  isoA2: string;
  lastUpdated: string | null;
  filedBy: string | null;
  categories: string[];
  entries: LegislationEntry[];
  entryCount: number;
}

export interface LegislationSummary {
  id: string;
  title: string;
  status: LegislationStatus;
  date: string | null;
  sectors: string[];
  impact: LegislationImpact;
  countrySlug: string;
  countryName: string;
  linkedEntityCount: number;
  sourceCount: number;
  category: string;
}

export interface LegislationDataset {
  countries: CountryLegislation[];
  totalEntries: number;
  allSectors: string[];
  generatedAt: string;
}
