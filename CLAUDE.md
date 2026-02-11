# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm start` — Start production server
- `npm run lint` — Run ESLint
- `npm run fetch-data` — Fetch corruption data from GitHub (requires GITHUB_PAT)
- `npm run fetch-entities` — Fetch entity data from GitHub (requires GITHUB_PAT)

## Architecture

Next.js 16 App Router project with React 19, TypeScript 5 (strict mode), and Tailwind CSS 4 + shadcn/ui.

### Data Pipeline (build-time)
- `scripts/lib/github.ts` — Shared GitHub API utils (ghFetch, processBatch, fetchFileContent)
- `scripts/fetch-data.ts` — Fetches 27 corruption-news.md files from `zepef/botexchange` via GitHub API
- `scripts/parse-markdown.ts` — Parses corruption markdown into structured data using unified/remark-parse mdast AST
- `scripts/fetch-entities.ts` — Fetches entity files from `zepef/botexchange/cerberus/countries/*/entities/`
- `scripts/parse-entity.ts` — Parses entity markdown (individuals, companies, foreign-states, organizations)
- `generated/corruption-data.json` — Build output (gitignored), consumed by app at build time
- `generated/entity-data.json` — Build output (gitignored), entity profiles + graph data
- `app/data/corruption-data.ts` — Accessor functions for corruption JSON
- `app/data/entity-data.ts` — Accessor functions for entity JSON

### App Structure
- `app/page.tsx` — Dashboard with interactive EU heat map and stats
- `app/country/[slug]/page.tsx` — 27 static country detail pages (generateStaticParams for SSG)
- `app/entities/page.tsx` — Filterable entity index page
- `app/entity/[type]/[slug]/page.tsx` — Entity profile pages (SSG via generateStaticParams)
- `app/graph/page.tsx` — Interactive force-directed relationship graph
- `app/components/` — UI components (eu-map, case-list, entity-*, graph-*, header, stats-bar, etc.)
- `app/lib/types.ts` — TypeScript interfaces for all data shapes
- `app/lib/constants.ts` — EU country slug→name→ISO mapping (Eurostat convention: Greece=EL)
- `app/lib/colors.ts` — d3 color scale + entity type colors + status badge colors
- `public/eu-topo.json` — Eurostat NUTS0 GeoJSON (72 countries, 27 EU filtered at render time)

### Key Libraries
- `@vnedyalk0v/react19-simple-maps` — React 19-compatible SVG map (client component, loaded with ssr:false)
- `d3-scale` + `d3-scale-chromatic` — Sequential color scale (interpolateOrRd)
- `unified` + `remark-parse` + `unist-util-visit` — Markdown AST parsing
- `react-force-graph-2d` — Canvas force-directed graph (client component, loaded with ssr:false)
- `shadcn/ui` — Card, Badge, Tooltip, Separator, ScrollArea, Button, Input, Select, Tabs components

## Key Conventions

- **Path alias:** `@/*` maps to project root for imports
- **Styling:** Glassmorphism dark theme — always dark background with frosted glass panels. Custom CSS classes: `.glass`, `.glass-card`, `.glass-strong`, `.map-glass`, `.graph-glass`, `.glow-hover`
- **ESLint:** Flat config format (`eslint.config.mjs`) extending `core-web-vitals` and `typescript` rulesets
- **Images:** Use `next/image` component, not `<img>` tags
- **Map component:** Must be loaded client-side only (ssr:false via eu-map-wrapper.tsx) because Geographies fetches GeoJSON at runtime
- **Graph component:** Must be loaded client-side only (ssr:false via graph-wrapper.tsx) because react-force-graph-2d uses Canvas
- **Greece edge case:** Eurostat uses ISO code `EL`, not `GR`. Handled in constants.ts
- **Entity slugs:** Format is `{type}/{name-slug}` (e.g., `individual/kurz-sebastian`)
