import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/app/lib/colors";
import type { CorruptionCase } from "@/app/lib/types";

interface CaseItemProps {
  caseData: CorruptionCase;
}

export function CaseItem({ caseData }: CaseItemProps) {
  const statusStyle = STATUS_COLORS[caseData.status] ?? STATUS_COLORS.unknown;

  return (
    <div className="glass-card glow-hover rounded-xl p-4 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">{caseData.title}</h4>
        <div className="flex items-center gap-2">
          {caseData.dateRange && (
            <span className="text-xs text-zinc-500 font-mono">
              {caseData.dateRange}
            </span>
          )}
          <Badge
            variant="secondary"
            className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[11px] font-medium uppercase tracking-wide`}
          >
            {caseData.status}
          </Badge>
        </div>
      </div>
      {caseData.description.length > 0 && (
        <ul className="mt-3 space-y-1">
          {caseData.description.slice(0, 4).map((desc, i) => (
            <li key={i} className="flex gap-2 text-xs text-zinc-400 leading-relaxed">
              <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
              {desc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
