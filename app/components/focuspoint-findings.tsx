import { Badge } from "@/components/ui/badge";
import type { FocusPointFinding } from "@/app/lib/types";

interface FocusPointFindingsProps {
  findings: FocusPointFinding[];
}

export function FocusPointFindings({ findings }: FocusPointFindingsProps) {
  if (findings.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Findings ({findings.length})
      </h2>
      <div className="space-y-4">
        {findings.map((finding, i) => (
          <div key={i} className="rounded-lg bg-white/5 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                {finding.title}
              </h3>
              <div className="flex items-center gap-2">
                {finding.relevance && (
                  <Badge
                    variant="secondary"
                    className="bg-cyan-500/20 text-cyan-300 border-0 text-[10px]"
                  >
                    {finding.relevance}
                  </Badge>
                )}
                {finding.date && (
                  <span className="text-xs text-zinc-500 font-mono">
                    {finding.date}
                  </span>
                )}
              </div>
            </div>
            {finding.summary.length > 0 && (
              <div className="mt-2 space-y-1">
                {finding.summary.map((line, j) => (
                  <p key={j} className="text-xs leading-relaxed text-zinc-400">
                    {line}
                  </p>
                ))}
              </div>
            )}
            {finding.sources.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-medium text-zinc-500 mb-1">Sources:</p>
                <ul className="space-y-0.5">
                  {finding.sources.map((src, j) => (
                    <li key={j} className="text-[10px] text-zinc-500">
                      {src}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
