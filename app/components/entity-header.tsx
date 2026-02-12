import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "./entity-avatar";
import { ENTITY_STATUS_COLORS } from "@/app/lib/colors";
import type { EntityData } from "@/app/lib/types";

interface EntityHeaderProps {
  entity: EntityData;
}

export function EntityHeader({ entity }: EntityHeaderProps) {
  const statusColor = ENTITY_STATUS_COLORS[entity.status] || ENTITY_STATUS_COLORS.unknown;

  return (
    <div className="space-y-6">
      <Link
        href="/entities"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to entities
      </Link>

      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <EntityAvatar initials={entity.initials} type={entity.type} imageUrl={entity.imageUrl} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white">{entity.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={`${statusColor.bg} ${statusColor.text} border-0`}>
                {entity.status}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-xs text-zinc-300">
                {entity.type}
              </Badge>
              <Link
                href={`/country/${entity.countrySlug}`}
                className="text-sm text-zinc-400 transition-colors hover:text-orange-400"
              >
                {entity.countryName}
              </Link>
            </div>
            {entity.role && (
              <p className="mt-2 text-sm text-zinc-300">{entity.role}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
              {entity.party && <span>Party: {entity.party}</span>}
              {entity.birthDate && <span>Born: {entity.birthDate}</span>}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{entity.cases.length}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-400">Cases</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{entity.connections.length}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-400">Links</p>
            </div>
          </div>
        </div>
        {entity.profileTitle && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <h2 className="text-sm font-semibold text-orange-400">{entity.profileTitle}</h2>
            {entity.profileSummary && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">{entity.profileSummary}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
