"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LegislationCard } from "./legislation-card";
import type {
  LegislationSummary,
  LegislationStatus,
  LegislationImpact,
} from "@/app/lib/types";

interface LegislationIndexClientProps {
  entries: LegislationSummary[];
  allSectors: string[];
}

const STATUS_OPTIONS: { value: LegislationStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "enacted", label: "Enacted" },
  { value: "proposed", label: "Proposed" },
  { value: "in-committee", label: "In Committee" },
  { value: "vetoed", label: "Vetoed" },
  { value: "repealed", label: "Repealed" },
  { value: "amended", label: "Amended" },
  { value: "stalled", label: "Stalled" },
];

const IMPACT_OPTIONS: { value: LegislationImpact | "all"; label: string }[] = [
  { value: "all", label: "All Impacts" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function LegislationIndexClient({
  entries,
  allSectors,
}: LegislationIndexClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LegislationStatus | "all">("all");
  const [impactFilter, setImpactFilter] = useState<LegislationImpact | "all">("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const countryOptions = useMemo(() => {
    const countries = new Map<string, string>();
    for (const e of entries) {
      countries.set(e.countrySlug, e.countryName);
    }
    return Array.from(countries.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [entries]);

  const sectorOptions = useMemo(() => {
    return allSectors.map((s) => ({ value: s, label: s }));
  }, [allSectors]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (impactFilter !== "all" && e.impact !== impactFilter) return false;
      if (countryFilter !== "all" && e.countrySlug !== countryFilter) return false;
      if (sectorFilter !== "all" && !e.sectors.includes(sectorFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.countryName.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.sectors.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [entries, search, statusFilter, impactFilter, countryFilter, sectorFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search legislation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as LegislationStatus | "all")
          }
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={impactFilter}
          onChange={(e) =>
            setImpactFilter(e.target.value as LegislationImpact | "all")
          }
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          {IMPACT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all" className="bg-zinc-900">
            All Countries
          </option>
          {countryOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="all" className="bg-zinc-900">
            All Sectors
          </option>
          {sectorOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {entries.length} legislative changes
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-sm text-zinc-400">
            No legislative changes match your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <LegislationCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
