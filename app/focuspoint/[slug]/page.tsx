import { notFound } from "next/navigation";
import { Header } from "@/app/components/header";
import { FocusPointHeader } from "@/app/components/focuspoint-header";
import { FocusPointFindings } from "@/app/components/focuspoint-findings";
import { FocusPointTimeline } from "@/app/components/focuspoint-timeline";
import { FocusPointEntities } from "@/app/components/focuspoint-entities";
import { getFocusPointBySlug, getAllFocusPointSlugs } from "@/app/data/focuspoint-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllFocusPointSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const fp = getFocusPointBySlug(slug);
  if (!fp) return { title: "FocusPoint Not Found" };

  return {
    title: `${fp.title} — CERBERUS 2026`,
    description: fp.description[0] ?? "FocusPoint investigation lead.",
  };
}

export default async function FocusPointPage({ params }: PageProps) {
  const { slug } = await params;
  const fp = getFocusPointBySlug(slug);

  if (!fp) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <FocusPointHeader focuspoint={fp} />

        <div className="mt-8 space-y-6">
          {/* Description */}
          {fp.description.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Description
              </h2>
              <div className="space-y-2">
                {fp.description.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-zinc-300">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {fp.links.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Links & Sources
              </h2>
              <ul className="space-y-1">
                {fp.links.map((link, i) => (
                  <li key={i} className="text-xs text-zinc-400 break-all">
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments */}
          {fp.attachments.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Attachments ({fp.attachments.length})
              </h2>
              <ul className="space-y-1">
                {fp.attachments.map((att, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{att.filename}</span>
                    <span className="text-zinc-600">
                      ({(att.sizeBytes / 1024).toFixed(0)} KB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bot findings */}
          <FocusPointFindings findings={fp.findings} />
          <FocusPointTimeline timeline={fp.timeline} />
          <FocusPointEntities entities={fp.linkedEntities} />

          {/* Additional sources from bot */}
          {fp.sources.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Sources
              </h2>
              <ul className="space-y-1">
                {fp.sources.map((source, i) => (
                  <li key={i} className="text-xs text-zinc-400">
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty bot data state */}
          {!fp.hasBotData && (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-zinc-400">
                This FocusPoint has not yet been processed by CERBERUS bots.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Bot findings, timeline, and entity references will appear here once investigation begins.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
