"use client";

import dynamic from "next/dynamic";
import type { GraphNode, GraphEdge } from "@/app/lib/types";

const RelationshipGraph = dynamic(
  () =>
    import("@/app/components/relationship-graph").then(
      (m) => m.RelationshipGraph
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="graph-glass flex items-center justify-center rounded-2xl"
        style={{ minHeight: 500 }}
      >
        <p className="text-sm text-zinc-500 animate-pulse">Loading graph...</p>
      </div>
    ),
  }
);

interface GraphWrapperProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function GraphWrapper({ nodes, edges }: GraphWrapperProps) {
  return <RelationshipGraph nodes={nodes} edges={edges} />;
}
