import { Header } from "@/app/components/header";
import { GraphWrapper } from "@/app/components/graph-wrapper";
import { GraphLegend } from "@/app/components/graph-legend";
import { getGraphData, getTotalEntityCount } from "@/app/data/entity-data";

export const metadata = {
  title: "Relationship Network — CERBERUS 2026",
  description: "Interactive force-directed graph showing connections between tracked entities across EU corruption cases.",
};

export default function GraphPage() {
  const graphData = getGraphData();
  const totalEntities = getTotalEntityCount();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Relationship Network
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {graphData.nodes.length} entities, {graphData.edges.length} connections
            {totalEntities > 0 && ` across ${totalEntities} tracked profiles`}
          </p>
        </div>

        <div className="mb-4">
          <GraphLegend />
        </div>

        {graphData.nodes.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-sm text-zinc-400">
              No entity data available. Entity profiles will appear here once the data pipeline runs.
            </p>
          </div>
        ) : (
          <GraphWrapper nodes={graphData.nodes} edges={graphData.edges} />
        )}

        <p className="mt-4 text-center text-xs text-zinc-500">
          Click a node to view the entity profile. Scroll to zoom. Drag to pan.
        </p>
      </main>
    </div>
  );
}
