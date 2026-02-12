"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
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
  fx?: number | undefined;
  fy?: number | undefined;
}

export function RelationshipGraph({ nodes, edges }: RelationshipGraphProps) {
  const router = useRouter();
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined) as React.MutableRefObject<ForceGraphMethods | undefined>;
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [chargeStrength, setChargeStrength] = useState(-200);
  const [linkDistance, setLinkDistance] = useState(100);
  const [centerStrength, setCenterStrength] = useState(1);

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
        (charge as unknown as { strength: (s: number) => void }).strength(chargeStrength);
      }
      const link = fg.d3Force("link");
      if (link && "distance" in link) {
        (link as unknown as { distance: (d: number) => void }).distance(linkDistance);
      }
      const center = fg.d3Force("center");
      if (center && "strength" in center) {
        (center as unknown as { strength: (s: number) => void }).strength(centerStrength);
      }
      fg.d3ReheatSimulation();
    }
  }, [chargeStrength, linkDistance, centerStrength]);

  const graphData = useMemo(() => ({
    nodes: nodes.map((n) => ({ ...n })),
    links: edges.map((e) => ({
      source: e.source,
      target: e.target,
      relationship: e.relationship,
    })),
  }), [nodes, edges]);

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

  const handleNodeDragEnd = useCallback((node: object) => {
    const n = node as GraphNodeInternal;
    n.fx = n.x;
    n.fy = n.y;
  }, []);

  return (
    <div ref={containerRef} className="graph-glass relative rounded-2xl overflow-hidden">
      {/* Controls toggle */}
      <button
        onClick={() => setShowControls((v) => !v)}
        className="absolute top-3 right-3 z-10 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur transition-colors hover:bg-white/20"
      >
        {showControls ? "Hide" : "Controls"}
      </button>

      {/* Control panel */}
      {showControls && (
        <div className="absolute top-12 right-3 z-10 w-56 rounded-xl bg-black/80 p-4 backdrop-blur space-y-4">
          <div>
            <label className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Repulsion</span>
              <span className="text-zinc-500">{chargeStrength}</span>
            </label>
            <input
              type="range"
              min={-500}
              max={-20}
              step={10}
              value={chargeStrength}
              onChange={(e) => setChargeStrength(Number(e.target.value))}
              className="mt-1 w-full accent-orange-500"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Link Distance</span>
              <span className="text-zinc-500">{linkDistance}</span>
            </label>
            <input
              type="range"
              min={20}
              max={300}
              step={10}
              value={linkDistance}
              onChange={(e) => setLinkDistance(Number(e.target.value))}
              className="mt-1 w-full accent-orange-500"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Center Pull</span>
              <span className="text-zinc-500">{centerStrength.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={centerStrength}
              onChange={(e) => setCenterStrength(Number(e.target.value))}
              className="mt-1 w-full accent-orange-500"
            />
          </div>
          <button
            onClick={() => {
              setChargeStrength(-200);
              setLinkDistance(100);
              setCenterStrength(1);
            }}
            className="w-full rounded-lg bg-white/10 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-white/20"
          >
            Reset
          </button>
        </div>
      )}

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
        onNodeDragEnd={handleNodeDragEnd}
        enableNodeDrag={true}
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
