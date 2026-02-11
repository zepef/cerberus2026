import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CountryData, EntitySummary } from "@/app/lib/types";

interface CountryHeaderProps {
  country: CountryData;
  entityProfiles?: EntitySummary[];
}

export function CountryHeader({ country, entityProfiles = [] }: CountryHeaderProps) {
  // Count statuses
  const statusCounts = new Map<string, number>();
  for (const c of country.cases) {
    statusCounts.set(c.status, (statusCounts.get(c.status) ?? 0) + 1);
  }

  // Build lookup: normalized entity name → slug for linkable pills
  const entityNameToSlug = new Map<string, string>();
  for (const ep of entityProfiles) {
    entityNameToSlug.set(ep.name.toLowerCase(), ep.slug);
  }

  function findEntitySlug(entityText: string): string | null {
    // Try matching the entity text against known entity names
    const lower = entityText.toLowerCase();
    for (const [name, slug] of entityNameToSlug) {
      if (lower.includes(name) || name.includes(lower)) {
        return slug;
      }
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to map
      </Link>

      <div className="glass-strong rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{country.name}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              ISO: {country.isoA2}
              {country.lastUpdated && ` · Updated ${country.lastUpdated}`}
              {country.filedBy && ` · Filed by ${country.filedBy}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-400">
                {country.caseCount}
              </p>
              <p className="text-xs uppercase tracking-wider text-zinc-400">
                Cases
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {country.sections.length}
              </p>
              <p className="text-xs uppercase tracking-wider text-zinc-400">
                Periods
              </p>
            </div>
          </div>
        </div>

        {country.context && (
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            {country.context}
          </p>
        )}

        {statusCounts.size > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(statusCounts.entries()).map(([status, count]) => (
              <Badge
                key={status}
                variant="outline"
                className="border-white/10 text-xs text-zinc-300"
              >
                {status}: {count}
              </Badge>
            ))}
          </div>
        )}

        {country.keyEntities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Key Entities
            </p>
            <div className="flex flex-wrap gap-2">
              {country.keyEntities.slice(0, 8).map((entity, i) => {
                const slug = findEntitySlug(entity);
                if (slug) {
                  return (
                    <Link
                      key={i}
                      href={`/entity/${slug}`}
                      className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-orange-400"
                    >
                      {entity}
                    </Link>
                  );
                }
                return (
                  <span
                    key={i}
                    className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300"
                  >
                    {entity}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
