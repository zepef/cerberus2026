"use client";

import { createColorScale } from "@/app/lib/colors";

interface MapLegendProps {
  maxCases: number;
}

export function MapLegend({ maxCases }: MapLegendProps) {
  const scale = createColorScale(maxCases);
  const steps = 6;
  const colors = Array.from({ length: steps }, (_, i) =>
    scale((i / (steps - 1)) * maxCases)
  );

  return (
    <div className="glass-card rounded-xl px-4 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
        Cases per country
      </p>
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500">0</span>
        <div className="flex flex-1">
          {colors.map((color, i) => (
            <div
              key={i}
              className="h-3 flex-1 first:rounded-l last:rounded-r"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-xs text-zinc-500">{maxCases}+</span>
      </div>
    </div>
  );
}
