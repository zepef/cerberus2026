import Link from "next/link";
import { Header } from "@/app/components/header";
import { FocusPointIndexClient } from "@/app/components/focuspoint-index-client";
import { getFocusPointSummaries, getTotalFocusPointCount } from "@/app/data/focuspoint-data";

export const metadata = {
  title: "FocusPoints — CERBERUS 2026",
  description: "User-submitted corruption investigation leads tracked by CERBERUS search bots.",
};

export default function FocusPointsPage() {
  const summaries = getFocusPointSummaries();
  const total = getTotalFocusPointCount();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              FocusPoints
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {total} investigation leads submitted for CERBERUS bot analysis
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
          >
            Submit a FocusPoint
          </Link>
        </div>

        <FocusPointIndexClient focuspoints={summaries} />
      </main>
    </div>
  );
}
