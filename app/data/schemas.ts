import { z } from "zod";

// --- Corruption data schemas ---

const CaseStatusSchema = z.enum([
  "ongoing", "convicted", "investigation", "exposed", "resolved", "acquitted", "unknown",
]);

const CorruptionCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: CaseStatusSchema,
  dateRange: z.string().nullable(),
  description: z.array(z.string()),
  section: z.string(),
});

const CountryDataSchema = z.object({
  slug: z.string(),
  name: z.string(),
  isoA2: z.string(),
  lastUpdated: z.string().nullable(),
  filedBy: z.string().nullable(),
  context: z.string().nullable(),
  cases: z.array(CorruptionCaseSchema),
  caseCount: z.number(),
  sections: z.array(z.string()),
  sources: z.array(z.string()),
  keyEntities: z.array(z.string()),
  tiRanking: z.string().nullable(),
  rawMarkdown: z.string(),
});

export const DashboardDataSchema = z.object({
  countries: z.array(CountryDataSchema),
  totalCases: z.number(),
  generatedAt: z.string(),
});

// --- Entity data schemas ---

const EntityTypeSchema = z.enum(["individual", "company", "foreign-state", "organization"]);

const EntityStatusSchema = z.enum([
  "convicted", "on-trial", "under-investigation", "sanctioned",
  "exposed", "acquitted", "active", "dissolved", "unknown",
]);

const EntityConnectionSchema = z.object({
  targetSlug: z.string(),
  targetName: z.string(),
  relationship: z.string(),
  resolved: z.boolean(),
});

const EntityCaseReferenceSchema = z.object({
  title: z.string(),
  countrySlug: z.string().nullable(),
  description: z.string().nullable(),
});

const EntityDataSchema = z.object({
  slug: z.string(),
  type: EntityTypeSchema,
  name: z.string(),
  countrySlug: z.string(),
  countryName: z.string(),
  status: EntityStatusSchema,
  role: z.string().nullable(),
  party: z.string().nullable(),
  birthDate: z.string().nullable(),
  biography: z.array(z.string()),
  cases: z.array(EntityCaseReferenceSchema),
  connections: z.array(EntityConnectionSchema),
  sources: z.array(z.string()),
  initials: z.string(),
  imageUrl: z.string().nullable(),
  profileTitle: z.string().nullable(),
  profileSummary: z.string().nullable(),
  whyTracked: z.string().nullable(),
  rawMarkdown: z.string(),
});

const GraphNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EntityTypeSchema,
  status: EntityStatusSchema,
  countrySlug: z.string(),
  initials: z.string(),
});

const GraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string(),
});

export const EntityDatasetSchema = z.object({
  entities: z.array(EntityDataSchema),
  totalEntities: z.number(),
  graphData: z.object({
    nodes: z.array(GraphNodeSchema),
    edges: z.array(GraphEdgeSchema),
  }),
  generatedAt: z.string(),
});

// --- Legislation data schemas ---

const LegislationStatusSchema = z.enum([
  "enacted", "proposed", "in-committee", "vetoed", "repealed", "amended", "stalled",
]);

const LegislationImpactSchema = z.enum(["high", "medium", "low"]);

const LinkedEntityRefSchema = z.object({
  displayName: z.string(),
  entitySlug: z.string().nullable(),
});

const LegislationEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: LegislationStatusSchema,
  date: z.string().nullable(),
  sectors: z.array(z.string()),
  impact: LegislationImpactSchema,
  linkedEntities: z.array(LinkedEntityRefSchema),
  description: z.array(z.string()),
  sources: z.array(z.string()),
  category: z.string(),
});

const CountryLegislationSchema = z.object({
  countrySlug: z.string(),
  countryName: z.string(),
  isoA2: z.string(),
  lastUpdated: z.string().nullable(),
  filedBy: z.string().nullable(),
  categories: z.array(z.string()),
  entries: z.array(LegislationEntrySchema),
  entryCount: z.number(),
});

export const LegislationDatasetSchema = z.object({
  countries: z.array(CountryLegislationSchema),
  totalEntries: z.number(),
  allSectors: z.array(z.string()),
  generatedAt: z.string(),
});
