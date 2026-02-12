# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server (data must be fetched first)
- `npm run build` — Production build (runs fetch-data + fetch-entities + fetch-legislation + next build)
- `npm start` — Start production server
- `npm run lint` — Run ESLint
- `npm run fetch-data` — Fetch corruption data from GitHub (requires GITHUB_PAT)
- `npm run fetch-entities` — Fetch entity data from GitHub (requires GITHUB_PAT)
- `npm run fetch-legislation` — Fetch legislation data from GitHub (requires GITHUB_PAT; runs after fetch-entities)

No test framework is configured.

### First-time setup

1. Create `.env.local` with `GITHUB_PAT=<token>` (scripts read this file manually, not via Next.js env)
2. Run `npm run fetch-data && npm run fetch-entities && npm run fetch-legislation` to populate `generated/` (gitignored)
3. Then `npm run dev` — without step 2, the app renders with empty data (accessors return safe defaults)

## Architecture

Next.js 16 App Router project with React 19, TypeScript 5 (strict mode), and Tailwind CSS 4 + shadcn/ui.

### Data Pipeline (build-time)
Scripts fetch markdown from `zepef/botexchange` via GitHub API, parse with unified/remark mdast AST, and write JSON to `generated/`. App accessors (`app/data/`) load JSON via `require()` at build time with graceful empty-data fallbacks.

- `scripts/lib/github.ts` — Shared GitHub API utils (ghFetch, processBatch, fetchFileContent)
- `scripts/fetch-data.ts` — Fetches 27 corruption-news.md files → `generated/corruption-data.json`
- `scripts/fetch-entities.ts` — Fetches entity files from `cerberus/countries/*/entities/` → `generated/entity-data.json`
- `scripts/parse-markdown.ts` — Parses corruption markdown into structured data
- `scripts/parse-entity.ts` — Parses entity markdown (individuals, companies, foreign-states, organizations)
- `scripts/fetch-legislation.ts` — Fetches legislative-changes.md files → `generated/legislation-data.json`
- `scripts/parse-legislation.ts` — Parses legislation markdown into structured data
- `app/data/corruption-data.ts` — Accessor functions for corruption JSON
- `app/data/entity-data.ts` — Accessor functions for entity JSON
- `app/data/legislation-data.ts` — Accessor functions for legislation JSON

### App Structure
- `app/page.tsx` — Dashboard with interactive EU heat map and stats
- `app/country/[slug]/page.tsx` — 27 static country detail pages (generateStaticParams for SSG)
- `app/entities/page.tsx` — Filterable entity index page
- `app/entity/[type]/[slug]/page.tsx` — Entity profile pages (SSG via generateStaticParams)
- `app/legislation/page.tsx` — Filterable legislation index page
- `app/graph/page.tsx` — Interactive force-directed relationship graph
- `app/components/` — App-specific UI components (eu-map, case-list, entity-*, legislation-*, graph-*, header, stats-bar)
- `components/ui/` — shadcn/ui primitives (Card, Badge, Tooltip, Separator, ScrollArea, Button, Input, Select, Tabs)
- `app/lib/types.ts` — TypeScript interfaces for all data shapes
- `app/lib/constants.ts` — EU country slug→name→ISO mapping (Eurostat convention: Greece=EL)
- `app/lib/colors.ts` — d3 color scale + entity type colors + status badge colors
- `public/eu-topo.json` — Eurostat NUTS0 GeoJSON (72 countries, 27 EU filtered at render time)

### Key Libraries
- `@vnedyalk0v/react19-simple-maps` — React 19-compatible SVG map (client component, loaded with ssr:false)
- `d3-scale` + `d3-scale-chromatic` — Sequential color scale (interpolateOrRd)
- `unified` + `remark-parse` + `unist-util-visit` — Markdown AST parsing
- `react-force-graph-2d` — Canvas force-directed graph (client component, loaded with ssr:false)

## Key Conventions

- **Path alias:** `@/*` maps to project root for imports
- **Styling:** Glassmorphism dark theme — always dark background with frosted glass panels. Custom CSS classes: `.glass`, `.glass-card`, `.glass-strong`, `.map-glass`, `.graph-glass`, `.glow-hover`
- **ESLint:** Flat config format (`eslint.config.mjs`) extending `core-web-vitals` and `typescript` rulesets
- **Images:** Use `next/image` component, not `<img>` tags
- **Map component:** Must be loaded client-side only (ssr:false via eu-map-wrapper.tsx) because Geographies fetches GeoJSON at runtime
- **Graph component:** Must be loaded client-side only (ssr:false via graph-wrapper.tsx) because react-force-graph-2d uses Canvas
- **Greece edge case:** Eurostat uses ISO code `EL`, not `GR`. Handled in constants.ts
- **Entity slugs:** Format is `{type}/{name-slug}` (e.g., `individual/kurz-sebastian`)
- **Data fetching:** Always commit and push after running fetch scripts (`fetch-data`, `fetch-entities`, `fetch-legislation`) if they produce any tracked file changes
