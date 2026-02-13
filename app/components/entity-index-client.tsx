"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EntityCard } from "./entity-card";
import type { EntitySummary, EntityType, EntityStatus } from "@/app/lib/types";

interface EntityIndexClientProps {
  entities: EntitySummary[];
}

const TYPE_OPTIONS: { value: EntityType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "individual", label: "Individuals" },
  { value: "company", label: "Companies" },
  { value: "foreign-state", label: "Foreign States" },
  { value: "organization", label: "Organizations" },
];

const STATUS_OPTIONS: { value: EntityStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "convicted", label: "Convicted" },
  { value: "on-trial", label: "On Trial" },
  { value: "under-investigation", label: "Under Investigation" },
  { value: "sanctioned", label: "Sanctioned" },
  { value: "exposed", label: "Exposed" },
  { value: "acquitted", label: "Acquitted" },
  { value: "active", label: "Active" },
  { value: "dissolved", label: "Dissolved" },
];

export function EntityIndexClient({ entities }: EntityIndexClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntityType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "all">("all");

  const filtered = useMemo(() => {
    return entities.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.countryName.toLowerCase().includes(q) ||
          (e.role && e.role.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [entities, search, typeFilter, statusFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            aria-label="Search entities"
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
          />
        </div>
        <select
          aria-label="Filter by entity type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as EntityType | "all")}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EntityStatus | "all")}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {entities.length} entities
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-sm text-zinc-400">No entities match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entity) => (
            <EntityCard key={entity.slug} entity={entity} />
          ))}
        </div>
      )}
    </div>
  );
}
