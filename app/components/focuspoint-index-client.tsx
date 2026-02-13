"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FocusPointCard } from "./focuspoint-card";
import type { FocusPointSummary, FocusPointStatus } from "@/app/lib/types";

interface FocusPointIndexClientProps {
  focuspoints: FocusPointSummary[];
}

const STATUS_OPTIONS: { value: FocusPointStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "investigating", label: "Investigating" },
  { value: "findings-available", label: "Findings Available" },
  { value: "completed", label: "Completed" },
  { value: "stale", label: "Stale" },
];

export function FocusPointIndexClient({ focuspoints }: FocusPointIndexClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FocusPointStatus | "all">("all");
  const [botDataOnly, setBotDataOnly] = useState(false);

  const filtered = useMemo(() => {
    return focuspoints.filter((fp) => {
      if (statusFilter !== "all" && fp.status !== statusFilter) return false;
      if (botDataOnly && !fp.hasBotData) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          fp.title.toLowerCase().includes(q) ||
          fp.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [focuspoints, search, statusFilter, botDataOnly]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            aria-label="Search focuspoints"
            placeholder="Search focuspoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FocusPointStatus | "all")}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={botDataOnly}
            onChange={(e) => setBotDataOnly(e.target.checked)}
            className="accent-orange-500"
          />
          Bot Data
        </label>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-zinc-500">
        {filtered.length} of {focuspoints.length} focuspoints
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-sm text-zinc-400">No focuspoints match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((fp) => (
            <FocusPointCard key={fp.slug} focuspoint={fp} />
          ))}
        </div>
      )}
    </div>
  );
}
