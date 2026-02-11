import { CaseItem } from "./case-item";
import type { CorruptionCase } from "@/app/lib/types";

interface CaseListProps {
  cases: CorruptionCase[];
  sections: string[];
}

export function CaseList({ cases, sections }: CaseListProps) {
  if (cases.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-zinc-400">No documented cases available.</p>
      </div>
    );
  }

  // Group cases by section
  const grouped = new Map<string, CorruptionCase[]>();
  for (const section of sections) {
    grouped.set(section, []);
  }
  for (const c of cases) {
    const list = grouped.get(c.section);
    if (list) {
      list.push(c);
    } else {
      grouped.set(c.section, [c]);
    }
  }

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([section, sectionCases]) => {
        if (sectionCases.length === 0) return null;
        return (
          <div key={section}>
            <h3 className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
              <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              {section}
              <span className="text-xs font-normal text-zinc-500">
                ({sectionCases.length})
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
            </h3>
            <div className="space-y-3">
              {sectionCases.map((c) => (
                <CaseItem key={c.id} caseData={c} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
