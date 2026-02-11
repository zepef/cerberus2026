"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "@vnedyalk0v/react19-simple-maps";
import { createColorScale, NON_EU_FILL, STROKE_DEFAULT, STROKE_HOVER } from "@/app/lib/colors";
import { EU_ISO_CODES, ISO_TO_SLUG, EU_COUNTRIES } from "@/app/lib/constants";
import { MapTooltip } from "./map-tooltip";
import type { CountrySummary } from "@/app/lib/types";

// Azimuthal equal-area projection centered on EU
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PROJECTION_CONFIG: any = {
  rotate: [-10, -51, 0],
  scale: 800,
};

interface EUMapProps {
  countries: CountrySummary[];
  maxCases: number;
}

interface TooltipState {
  name: string;
  caseCount: number;
  x: number;
  y: number;
  visible: boolean;
}

export function EUMap({ countries, maxCases }: EUMapProps) {
  const router = useRouter();
  const colorScale = createColorScale(maxCases);

  // Fetch GeoJSON client-side and pass as data object (avoids URL construction issues)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/eu-topo.json")
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  const [tooltip, setTooltip] = useState<TooltipState>({
    name: "",
    caseCount: 0,
    x: 0,
    y: 0,
    visible: false,
  });

  // Build lookup: isoA2 → CountrySummary
  const countryMap = new Map<string, CountrySummary>();
  for (const c of countries) {
    countryMap.set(c.isoA2, c);
  }

  const handleMouseEnter = useCallback(
    (geo: { properties: { id: string; na: string } }, event: React.MouseEvent) => {
      const iso = geo.properties.id;
      if (!EU_ISO_CODES.has(iso)) return;

      const country = countryMap.get(iso);
      const slug = ISO_TO_SLUG[iso];
      const name = country?.name ?? EU_COUNTRIES[slug]?.name ?? geo.properties.na ?? iso;
      const caseCount = country?.caseCount ?? 0;

      setTooltip({
        name,
        caseCount,
        x: event.clientX,
        y: event.clientY,
        visible: true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countries]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (tooltip.visible) {
        setTooltip((prev) => ({ ...prev, x: event.clientX, y: event.clientY }));
      }
    },
    [tooltip.visible]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleClick = useCallback(
    (iso: string) => {
      const slug = ISO_TO_SLUG[iso];
      if (slug) {
        router.push(`/country/${slug}`);
      }
    },
    [router]
  );

  if (!geoData) {
    return (
      <div className="map-glass flex items-center justify-center" style={{ minHeight: 450 }}>
        <p className="text-sm text-zinc-500 animate-pulse">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="map-glass relative overflow-hidden">
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={PROJECTION_CONFIG}
        width={800}
        height={600}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoData}>
          {({ geographies }: { geographies: Array<{ rsmKey?: string; properties: { id: string; na: string } }> }) =>
            geographies.map((geo, i) => {
              const iso = geo.properties.id;
              const isEU = EU_ISO_CODES.has(iso);
              const country = countryMap.get(iso);
              const caseCount = country?.caseCount ?? 0;

              // Color: EU countries by case count, non-EU get neutral
              const fill = isEU
                ? caseCount > 0
                  ? colorScale(caseCount)
                  : "#fef3c7"
                : NON_EU_FILL;

              return (
                <Geography
                  key={geo.rsmKey ?? `geo-${iso}-${i}`}
                  geography={geo}
                  fill={fill}
                  stroke={STROKE_DEFAULT}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: isEU
                      ? {
                          outline: "none",
                          fill,
                          stroke: STROKE_HOVER,
                          strokeWidth: 1.5,
                          cursor: "pointer",
                        }
                      : { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={(event: React.MouseEvent) => handleMouseEnter(geo, event)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => isEU && handleClick(iso)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <MapTooltip {...tooltip} />
    </div>
  );
}
