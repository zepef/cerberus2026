import { notFound } from "next/navigation";
import { Header } from "@/app/components/header";
import { CountryHeader } from "@/app/components/country-header";
import { CaseList } from "@/app/components/case-list";
import { getCountryBySlug, getAllSlugs } from "@/app/data/corruption-data";

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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <CountryHeader country={country} />

        <div className="mt-8">
          <CaseList cases={country.cases} sections={country.sections} />
        </div>

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
