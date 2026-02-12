import { Badge } from "@/components/ui/badge";
import { LEGISLATION_STATUS_COLORS, LEGISLATION_IMPACT_COLORS } from "@/app/lib/colors";
import type { LegislationSummary } from "@/app/lib/types";

interface LegislationCardProps {
  entry: LegislationSummary;
}

export function LegislationCard({ entry }: LegislationCardProps) {
  const statusStyle =
    LEGISLATION_STATUS_COLORS[entry.status] ?? LEGISLATION_STATUS_COLORS.proposed;
  const impactStyle =
    LEGISLATION_IMPACT_COLORS[entry.impact] ?? LEGISLATION_IMPACT_COLORS.medium;

  return (
    <div className="glass-card glow-hover rounded-xl p-4 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">{entry.title}</h4>
        {entry.date && (
          <span className="text-xs text-zinc-500 font-mono">{entry.date}</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="secondary"
          className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[11px] font-medium uppercase tracking-wide`}
        >
          {entry.status}
        </Badge>
        <Badge
          variant="secondary"
          className={`${impactStyle.bg} ${impactStyle.text} border-0 text-[11px] font-medium uppercase tracking-wide`}
        >
          {entry.impact} impact
        </Badge>
        <span className="text-[10px] text-zinc-500">{entry.countryName}</span>
      </div>

      {entry.sectors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.sectors.map((sector) => (
            <span
              key={sector}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400"
            >
              {sector}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-3 text-[10px] text-zinc-500">
        {entry.linkedEntityCount > 0 && (
          <span>{entry.linkedEntityCount} linked entities</span>
        )}
        {entry.sourceCount > 0 && <span>{entry.sourceCount} sources</span>}
        {entry.category && <span>{entry.category}</span>}
      </div>
    </div>
  );
}
