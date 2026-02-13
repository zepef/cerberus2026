import Link from "next/link";
import type { FocusPointEntityRef } from "@/app/lib/types";

interface FocusPointEntitiesProps {
  entities: FocusPointEntityRef[];
}

export function FocusPointEntities({ entities }: FocusPointEntitiesProps) {
  if (entities.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Linked Entities ({entities.length})
      </h2>
      <div className="space-y-2">
        {entities.map((ref, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              {ref.entitySlug ? (
                <Link
                  href={`/entity/${ref.entitySlug}`}
                  className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {ref.displayName}
                </Link>
              ) : (
                <span className="text-sm font-medium text-white">
                  {ref.displayName}
                </span>
              )}
            </div>
            {ref.role && (
              <span className="text-xs text-zinc-500">{ref.role}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
