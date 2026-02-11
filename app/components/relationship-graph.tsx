"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { ENTITY_TYPE_COLORS } from "@/app/lib/colors";
import type { GraphNode, GraphEdge } from "@/app/lib/types";

interface RelationshipGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphNodeInternal extends GraphNode {
  x?: number;
  y?: number;
}

export function RelationshipGraph({ nodes, edges }: RelationshipGraphProps) {
  const router = useRouter();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined) as React.MutableRefObject<ForceGraphMethods | undefined>;
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: Math.max(500, window.innerHeight - 250),
        });
      }
    }
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      const fg = fgRef.current;
      const charge = fg.d3Force("charge");
      if (charge && "strength" in charge) {
        (charge as unknown as { strength: (s: number) => void }).strength(-200);
      }
      const link = fg.d3Force("link");
      if (link && "distance" in link) {
        (link as unknown as { distance: (d: number) => void }).distance(100);
      }
    }
  }, []);

  const graphData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: edges.map((e) => ({
      source: e.source,
      target: e.target,
      relationship: e.relationship,
    })),
  };

  const paintNode = useCallback(
    (node: GraphNodeInternal, ctx: CanvasRenderingContext2D) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const isHovered = hoveredNode === node.id;
      const baseColor = ENTITY_TYPE_COLORS[node.type] || ENTITY_TYPE_COLORS.individual;
      const radius = isHovered ? 14 : 10;

      // Glow effect
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = `${baseColor}33`;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Initials
      ctx.font = `bold ${isHovered ? 8 : 6}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(node.initials, x, y);

      // Name label on hover
      if (isHovered) {
        ctx.font = "11px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(node.name, x, y + radius + 14);
      }
    },
    [hoveredNode]
  );

  const handleNodeClick = useCallback(
    (node: GraphNodeInternal) => {
      router.push(`/entity/${node.id}`);
    },
    [router]
  );

  return (
    <div ref={containerRef} className="graph-glass rounded-2xl overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={paintNode as (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
        nodePointerAreaPaint={(node: object, color: string, ctx: CanvasRenderingContext2D) => {
          const n = node as GraphNodeInternal;
          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, 14, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeHover={(node: object | null) => {
          const n = node as GraphNodeInternal | null;
          setHoveredNode(n?.id ?? null);
        }}
        onNodeClick={(node: object) => handleNodeClick(node as GraphNodeInternal)}
        linkColor={() => "rgba(255,255,255,0.1)"}
        linkWidth={1.5}
        linkCurvature={0.2}
        linkDirectionalParticles={0}
        cooldownTicks={100}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
