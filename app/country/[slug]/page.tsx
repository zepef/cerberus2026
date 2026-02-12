import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/app/components/header";
import { CountryHeader } from "@/app/components/country-header";
import { CaseList } from "@/app/components/case-list";
import { EntityAvatar } from "@/app/components/entity-avatar";
import { getCountryBySlug, getAllSlugs } from "@/app/data/corruption-data";
import { getEntitiesByCountry } from "@/app/data/entity-data";
import { ENTITY_STATUS_COLORS } from "@/app/lib/colors";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) return { title: "Country Not Found" };

  return {
    title: `${country.name} — CERBERUS 2026`,
    description: `${country.caseCount} documented corruption cases in ${country.name}. EU corruption tracking dashboard.`,
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { slug } = await params;
  const country = getCountryBySlug(slug);

  if (!country) {
    notFound();
  }

  const countryEntities = getEntitiesByCountry(slug);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <CountryHeader country={country} entityProfiles={countryEntities} />

        <div className="mt-8">
          <CaseList cases={country.cases} sections={country.sections} />
        </div>

        {countryEntities.length > 0 && (
          <div className="mt-8 glass-card rounded-xl p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Entity Profiles
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {countryEntities.map((entity) => {
                const statusColor =
                  ENTITY_STATUS_COLORS[entity.status] || ENTITY_STATUS_COLORS.unknown;
                return (
                  <Link
                    key={entity.slug}
                    href={`/entity/${entity.slug}`}
                    className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/8"
                  >
                    <EntityAvatar
                      initials={entity.initials}
                      type={entity.type}
                      imageUrl={entity.imageUrl}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {entity.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {entity.role || entity.type}
                      </p>
                    </div>
                    <Badge
                      className={`${statusColor.bg} ${statusColor.text} border-0 text-[10px] px-1.5 py-0`}
                    >
                      {entity.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {country.sources.length > 0 && (
          <div className="mt-8 glass-card rounded-xl p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Sources
            </h3>
            <ul className="space-y-1">
              {country.sources.map((source, i) => (
                <li key={i} className="text-xs text-zinc-400">
                  {source}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
