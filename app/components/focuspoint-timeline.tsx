import type { FocusPointTimelineEntry } from "@/app/lib/types";

interface FocusPointTimelineProps {
  timeline: FocusPointTimelineEntry[];
}

export function FocusPointTimeline({ timeline }: FocusPointTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Timeline ({timeline.length})
      </h2>
      <div className="relative space-y-4 pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-1 bottom-1 w-px bg-white/10" />

        {timeline.map((entry, i) => (
          <div key={i} className="relative">
            {/* Dot */}
            <div className="absolute -left-4 top-1.5 h-2 w-2 rounded-full bg-orange-500" />

            <div>
              <span className="text-xs font-mono text-zinc-500">
                {entry.date}
              </span>
              <p className="text-sm text-zinc-300">{entry.event}</p>
              {entry.source && (
                <p className="text-[10px] text-zinc-500">
                  Source: {entry.source}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
