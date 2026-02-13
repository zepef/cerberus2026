import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FOCUSPOINT_STATUS_COLORS } from "@/app/lib/colors";
import type { FocusPointSummary } from "@/app/lib/types";

interface FocusPointCardProps {
  focuspoint: FocusPointSummary;
}

export function FocusPointCard({ focuspoint }: FocusPointCardProps) {
  const statusStyle =
    FOCUSPOINT_STATUS_COLORS[focuspoint.status] ?? FOCUSPOINT_STATUS_COLORS.new;

  return (
    <Link href={`/focuspoint/${focuspoint.slug}`}>
      <div className="glass-card glow-hover rounded-xl p-4 transition-all">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-white">{focuspoint.title}</h4>
          {focuspoint.createdAt && (
            <span className="text-xs text-zinc-500 font-mono">
              {new Date(focuspoint.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge
            variant="secondary"
            className={`${statusStyle.bg} ${statusStyle.text} border-0 text-[11px] font-medium uppercase tracking-wide`}
          >
            {focuspoint.status}
          </Badge>
          {focuspoint.hasBotData && (
            <Badge
              variant="secondary"
              className="bg-orange-500/20 text-orange-300 border-0 text-[11px] font-medium uppercase tracking-wide"
            >
              Bot Data
            </Badge>
          )}
        </div>

        {focuspoint.description && (
          <p className="mt-2 text-xs text-zinc-400 line-clamp-2">
            {focuspoint.description}
          </p>
        )}

        <div className="mt-2 flex gap-3 text-[10px] text-zinc-500">
          {focuspoint.linkCount > 0 && (
            <span>{focuspoint.linkCount} links</span>
          )}
          {focuspoint.attachmentCount > 0 && (
            <span>{focuspoint.attachmentCount} files</span>
          )}
          {focuspoint.findingCount > 0 && (
            <span>{focuspoint.findingCount} findings</span>
          )}
        </div>
      </div>
    </Link>
  );
}
