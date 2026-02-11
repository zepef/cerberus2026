import { scaleSequential } from "d3-scale";
import { interpolateOrRd } from "d3-scale-chromatic";

// Sequential color scale: cream → orange → dark red
// Domain is set dynamically based on max case count
export function createColorScale(maxCases: number) {
  return scaleSequential(interpolateOrRd).domain([0, maxCases]);
}

// Neutral fill for non-EU countries
export const NON_EU_FILL = "#1e293b"; // slate-800

// Zero-case fill (unlikely but handle gracefully)
export const ZERO_CASE_FILL = "#fef3c7"; // warm cream

// Map stroke colors
export const STROKE_DEFAULT = "rgba(255, 255, 255, 0.2)";
export const STROKE_HOVER = "rgba(255, 255, 255, 0.6)";

// Status badge colors
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ongoing: { bg: "bg-amber-500/20", text: "text-amber-300" },
  convicted: { bg: "bg-red-500/20", text: "text-red-300" },
  investigation: { bg: "bg-blue-500/20", text: "text-blue-300" },
  exposed: { bg: "bg-purple-500/20", text: "text-purple-300" },
  resolved: { bg: "bg-green-500/20", text: "text-green-300" },
  acquitted: { bg: "bg-slate-500/20", text: "text-slate-300" },
  unknown: { bg: "bg-zinc-500/20", text: "text-zinc-300" },
};
