import { ENTITY_TYPE_COLORS } from "@/app/lib/colors";

const LEGEND_ITEMS = [
  { type: "individual", label: "Individual" },
  { type: "company", label: "Company" },
  { type: "foreign-state", label: "Foreign State" },
  { type: "organization", label: "Organization" },
] as const;

export function GraphLegend() {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Node Types
      </p>
      <div className="flex flex-wrap gap-4">
        {LEGEND_ITEMS.map(({ type, label }) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: ENTITY_TYPE_COLORS[type] }}
            />
            <span className="text-xs text-zinc-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
