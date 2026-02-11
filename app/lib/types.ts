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
