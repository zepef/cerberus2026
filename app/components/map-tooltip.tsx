"use client";

interface MapTooltipProps {
  name: string;
  caseCount: number;
  x: number;
  y: number;
  visible: boolean;
}

export function MapTooltip({ name, caseCount, x, y, visible }: MapTooltipProps) {
  if (!visible) return null;

  return (
    <div
      role="tooltip"
      className="glass-strong pointer-events-none fixed z-50 rounded-lg px-3 py-2 text-sm"
      style={{
        left: x + 12,
        top: y - 10,
        transform: "translateY(-100%)",
      }}
    >
      <p className="font-semibold text-white">{name}</p>
      <p className="text-xs text-zinc-300">
        {caseCount} {caseCount === 1 ? "case" : "cases"} documented
      </p>
    </div>
  );
}
