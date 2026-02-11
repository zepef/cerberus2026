import { Header } from "@/app/components/header";
import { EntityIndexClient } from "@/app/components/entity-index-client";
import { getEntitySummaries, getTotalEntityCount } from "@/app/data/entity-data";

export const metadata = {
  title: "Entity Profiles — CERBERUS 2026",
  description: "Browse all tracked individuals, companies, foreign states, and organizations involved in EU corruption cases.",
};

export default function EntitiesPage() {
  const summaries = getEntitySummaries();
  const total = getTotalEntityCount();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Entity Profiles
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {total} individuals, companies, and organizations tracked across the EU
          </p>
        </div>

        <EntityIndexClient entities={summaries} />
      </main>
    </div>
  );
}
