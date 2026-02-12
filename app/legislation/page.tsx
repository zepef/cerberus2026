import { Header } from "@/app/components/header";
import { LegislationIndexClient } from "@/app/components/legislation-index-client";
import {
  getLegislationSummaries,
  getAllSectors,
  getTotalLegislationCount,
} from "@/app/data/legislation-data";

export const metadata = {
  title: "Legislative Changes — CERBERUS 2026",
  description:
    "Track anti-corruption and governance legislative changes across all 27 EU member states.",
};

export default function LegislationPage() {
  const summaries = getLegislationSummaries();
  const allSectors = getAllSectors();
  const total = getTotalLegislationCount();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Legislative Changes
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {total} legislative changes tracked across EU member states
          </p>
        </div>

        <LegislationIndexClient entries={summaries} allSectors={allSectors} />
      </main>
    </div>
  );
}
