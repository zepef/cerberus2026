import Link from "next/link";
import { EntityAvatar } from "./entity-avatar";
import { Badge } from "@/components/ui/badge";
import { ENTITY_STATUS_COLORS } from "@/app/lib/colors";
import type { EntitySummary } from "@/app/lib/types";

interface EntityCardProps {
  entity: EntitySummary;
}

export function EntityCard({ entity }: EntityCardProps) {
  const statusColor = ENTITY_STATUS_COLORS[entity.status] || ENTITY_STATUS_COLORS.unknown;

  return (
    <Link
      href={`/entity/${entity.slug}`}
      className="glass-card glow-hover flex items-start gap-3 rounded-xl p-4 transition-all"
    >
      <EntityAvatar initials={entity.initials} type={entity.type} size="md" />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-white truncate">{entity.name}</h3>
        <p className="text-xs text-zinc-400 truncate">
          {entity.role || entity.type}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge className={`${statusColor.bg} ${statusColor.text} border-0 text-[10px] px-1.5 py-0`}>
            {entity.status}
          </Badge>
          <span className="text-[10px] text-zinc-500">{entity.countryName}</span>
        </div>
        <div className="mt-1 flex gap-3 text-[10px] text-zinc-500">
          <span>{entity.caseCount} cases</span>
          <span>{entity.connectionCount} links</span>
        </div>
      </div>
    </Link>
  );
}
