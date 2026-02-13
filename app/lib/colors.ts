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

// Entity type colors for avatars and graph nodes
export const ENTITY_TYPE_COLORS: Record<string, string> = {
  individual: "#3b82f6",
  company: "#10b981",
  "foreign-state": "#ef4444",
  organization: "#8b5cf6",
};

// Entity type gradient classes for avatar backgrounds
export const ENTITY_TYPE_GRADIENTS: Record<string, string> = {
  individual: "from-blue-600 to-blue-400",
  company: "from-emerald-600 to-emerald-400",
  "foreign-state": "from-red-600 to-red-400",
  organization: "from-violet-600 to-violet-400",
};

// Entity status badge colors
export const ENTITY_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  convicted: { bg: "bg-red-500/20", text: "text-red-300" },
  "on-trial": { bg: "bg-amber-500/20", text: "text-amber-300" },
  "under-investigation": { bg: "bg-blue-500/20", text: "text-blue-300" },
  sanctioned: { bg: "bg-orange-500/20", text: "text-orange-300" },
  exposed: { bg: "bg-purple-500/20", text: "text-purple-300" },
  acquitted: { bg: "bg-green-500/20", text: "text-green-300" },
  active: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
  dissolved: { bg: "bg-zinc-500/20", text: "text-zinc-300" },
  unknown: { bg: "bg-zinc-500/20", text: "text-zinc-400" },
};

// Legislation status badge colors
export const LEGISLATION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  enacted: { bg: "bg-green-500/20", text: "text-green-300" },
  proposed: { bg: "bg-blue-500/20", text: "text-blue-300" },
  "in-committee": { bg: "bg-amber-500/20", text: "text-amber-300" },
  vetoed: { bg: "bg-red-500/20", text: "text-red-300" },
  repealed: { bg: "bg-zinc-500/20", text: "text-zinc-300" },
  amended: { bg: "bg-purple-500/20", text: "text-purple-300" },
  stalled: { bg: "bg-orange-500/20", text: "text-orange-300" },
};

// Legislation impact badge colors
export const LEGISLATION_IMPACT_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: "bg-red-500/20", text: "text-red-300" },
  medium: { bg: "bg-amber-500/20", text: "text-amber-300" },
  low: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
};

// FocusPoint status badge colors
export const FOCUSPOINT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "bg-cyan-500/20", text: "text-cyan-300" },
  investigating: { bg: "bg-amber-500/20", text: "text-amber-300" },
  "findings-available": { bg: "bg-green-500/20", text: "text-green-300" },
  completed: { bg: "bg-blue-500/20", text: "text-blue-300" },
  stale: { bg: "bg-zinc-500/20", text: "text-zinc-300" },
};

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
