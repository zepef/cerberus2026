"use client";

import dynamic from "next/dynamic";
import type { CountrySummary } from "@/app/lib/types";

const EUMap = dynamic(
  () => import("@/app/components/eu-map").then((m) => m.EUMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="map-glass flex items-center justify-center"
        style={{ minHeight: 450 }}
      >
        <p className="text-sm text-zinc-500 animate-pulse">Loading map...</p>
      </div>
    ),
  }
);

interface EUMapWrapperProps {
  countries: CountrySummary[];
  maxCases: number;
}

export function EUMapWrapper({ countries, maxCases }: EUMapWrapperProps) {
  return <EUMap countries={countries} maxCases={maxCases} />;
}
