import { Header } from "@/app/components/header";
import { StatsBar } from "@/app/components/stats-bar";
import { EUMapWrapper } from "@/app/components/eu-map-wrapper";
import { MapLegend } from "@/app/components/map-legend";
import { getDashboardData, getCountrySummaries, getMaxCaseCount } from "@/app/data/corruption-data";
import { getTotalEntityCount } from "@/app/data/entity-data";

export default function DashboardPage() {
  const data = getDashboardData();
  const summaries = getCountrySummaries();
  const maxCases = getMaxCaseCount();
  const totalEntities = getTotalEntityCount();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            EU Corruption Overview
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Tracking documented corruption cases across all 27 EU member states
          </p>
        </div>

        <div className="mb-8">
          <StatsBar
            totalCountries={data.countries.length}
            totalCases={data.totalCases}
            totalEntities={totalEntities}
            generatedAt={data.generatedAt}
          />
        </div>

        <div className="mb-6">
          <EUMapWrapper countries={summaries} maxCases={maxCases} />
        </div>

        <div className="mb-8 max-w-xs mx-auto">
          <MapLegend maxCases={maxCases} />
        </div>

        {/* Country list below map */}
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
            All Countries
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {data.countries.map((c) => (
              <a
                key={c.slug}
                href={`/country/${c.slug}`}
                className="glass-card glow-hover flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all"
              >
                <span className="text-zinc-200 truncate">{c.name}</span>
                <span className="ml-2 font-mono text-xs text-orange-400">
                  {c.caseCount}
                </span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
