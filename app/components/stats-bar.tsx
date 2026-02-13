interface StatsBarProps {
  totalCountries: number;
  totalCases: number;
  totalEntities: number;
  generatedAt: string;
}

export function StatsBar({ totalCountries, totalCases, totalEntities, generatedAt }: StatsBarProps) {
  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="glass-card rounded-xl p-4 text-center" aria-label={`${totalCountries} EU Countries`}>
        <p className="text-2xl font-bold text-white">{totalCountries}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
          EU Countries
        </p>
      </div>
      <div className="glass-card rounded-xl p-4 text-center" aria-label={`${totalCases} Documented Cases`}>
        <p className="text-2xl font-bold text-orange-400">{totalCases}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
          Documented Cases
        </p>
      </div>
      <div className="glass-card rounded-xl p-4 text-center" aria-label={`${totalEntities} Entity Profiles`}>
        <p className="text-2xl font-bold text-blue-400">{totalEntities}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
          Entity Profiles
        </p>
      </div>
      <div className="glass-card rounded-xl p-4 text-center" aria-label={`Last updated ${formattedDate}`}>
        <p className="text-2xl font-bold text-white">{formattedDate}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
          Last Updated
        </p>
      </div>
    </div>
  );
}
