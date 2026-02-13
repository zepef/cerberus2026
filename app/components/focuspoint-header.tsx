import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FOCUSPOINT_STATUS_COLORS } from "@/app/lib/colors";
import type { FocusPointData } from "@/app/lib/types";

interface FocusPointHeaderProps {
  focuspoint: FocusPointData;
}

export function FocusPointHeader({ focuspoint }: FocusPointHeaderProps) {
  const statusStyle =
    FOCUSPOINT_STATUS_COLORS[focuspoint.status] ?? FOCUSPOINT_STATUS_COLORS.new;

  return (
    <div className="space-y-6">
      <Link
        href="/focuspoints"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to FocusPoints
      </Link>

      <div className="glass-strong rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-white">{focuspoint.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge
            className={`${statusStyle.bg} ${statusStyle.text} border-0`}
          >
            {focuspoint.status}
          </Badge>
          {focuspoint.hasBotData && (
            <Badge className="bg-orange-500/20 text-orange-300 border-0">
              Bot Data Available
            </Badge>
          )}
          <span className="text-xs text-zinc-500">
            Submitted by {focuspoint.submittedBy}
          </span>
          {focuspoint.createdAt && (
            <span className="text-xs text-zinc-500">
              on {new Date(focuspoint.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">
              {focuspoint.findings.length}
            </p>
            <p className="text-xs uppercase tracking-wider text-zinc-400">
              Findings
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {focuspoint.linkedEntities.length}
            </p>
            <p className="text-xs uppercase tracking-wider text-zinc-400">
              Entities
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-400">
              {focuspoint.sources.length}
            </p>
            <p className="text-xs uppercase tracking-wider text-zinc-400">
              Sources
            </p>
          </div>
        </div>

        {/* Search Directives */}
        {focuspoint.searchDirectives.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Search Directives
            </h3>
            <ul className="space-y-1">
              {focuspoint.searchDirectives.map((d, i) => (
                <li key={i} className="text-sm text-zinc-300">{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
