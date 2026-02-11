import Link from "next/link";
import { EntityAvatar } from "./entity-avatar";
import type { EntityConnection, EntityType } from "@/app/lib/types";

interface EntityConnectionsProps {
  connections: EntityConnection[];
}

function inferTypeFromSlug(slug: string): EntityType {
  if (slug.startsWith("company/")) return "company";
  if (slug.startsWith("foreign-state/")) return "foreign-state";
  if (slug.startsWith("organization/")) return "organization";
  return "individual";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function EntityConnections({ connections }: EntityConnectionsProps) {
  if (connections.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Connections
      </h2>
      <div className="space-y-3">
        {connections.map((conn, i) => {
          const type = conn.resolved ? inferTypeFromSlug(conn.targetSlug) : "individual";
          const initials = getInitials(conn.targetName);

          const content = (
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/8">
              <EntityAvatar initials={initials} type={type} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {conn.targetName}
                </p>
                <p className="text-xs text-zinc-400 truncate">{conn.relationship}</p>
              </div>
              {conn.resolved && (
                <span className="shrink-0 text-[10px] text-emerald-500">linked</span>
              )}
            </div>
          );

          if (conn.resolved) {
            return (
              <Link key={i} href={`/entity/${conn.targetSlug}`}>
                {content}
              </Link>
            );
          }

          return <div key={i}>{content}</div>;
        })}
      </div>
    </div>
  );
}
