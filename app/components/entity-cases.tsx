import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { EntityCaseReference } from "@/app/lib/types";

interface EntityCasesProps {
  cases: EntityCaseReference[];
}

export function EntityCases({ cases }: EntityCasesProps) {
  if (cases.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Cases Involved
      </h2>
      <div className="space-y-4">
        {cases.map((c, i) => (
          <div key={i} className="rounded-lg bg-white/5 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-white">{c.title}</h3>
              {c.countrySlug && (
                <Link
                  href={`/country/${c.countrySlug}`}
                  className="shrink-0 text-zinc-400 transition-colors hover:text-orange-400"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
            {c.description && (
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {c.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
