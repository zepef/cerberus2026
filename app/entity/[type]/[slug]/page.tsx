import { notFound } from "next/navigation";
import { Header } from "@/app/components/header";
import { EntityHeader } from "@/app/components/entity-header";
import { EntityBio } from "@/app/components/entity-bio";
import { EntityCases } from "@/app/components/entity-cases";
import { EntityConnections } from "@/app/components/entity-connections";
import { getEntityBySlug, getAllEntitySlugs } from "@/app/data/entity-data";

interface PageProps {
  params: Promise<{ type: string; slug: string }>;
}

export function generateStaticParams() {
  return getAllEntitySlugs();
}

export async function generateMetadata({ params }: PageProps) {
  const { type, slug } = await params;
  const entity = getEntityBySlug(`${type}/${slug}`);
  if (!entity) return { title: "Entity Not Found" };

  return {
    title: `${entity.name} — CERBERUS 2026`,
    description: `${entity.name} — ${entity.role || entity.type}. ${entity.cases.length} cases, ${entity.connections.length} connections.`,
  };
}

export default async function EntityPage({ params }: PageProps) {
  const { type, slug } = await params;
  const entity = getEntityBySlug(`${type}/${slug}`);

  if (!entity) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EntityHeader entity={entity} />

        <div className="mt-8 space-y-6">
          <EntityBio biography={entity.biography} />
          <EntityCases cases={entity.cases} />
          <EntityConnections connections={entity.connections} />

          {entity.sources.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Sources
              </h2>
              <ul className="space-y-1">
                {entity.sources.map((source, i) => (
                  <li key={i} className="text-xs text-zinc-400">
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
