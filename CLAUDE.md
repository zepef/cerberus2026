# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm start` — Start production server
- `npm run lint` — Run ESLint
- `npm run fetch-data` — Fetch corruption data from GitHub (requires GITHUB_PAT in .env.local)

## Architecture

Next.js 16 App Router project with React 19, TypeScript 5 (strict mode), and Tailwind CSS 4 + shadcn/ui.

### Data Pipeline (build-time)
- `scripts/fetch-data.ts` — Fetches 27 corruption-news.md files from `zepef/botexchange` via GitHub API
- `scripts/parse-markdown.ts` — Parses markdown into structured data using unified/remark-parse mdast AST
- `generated/corruption-data.json` — Build output (gitignored), consumed by app at build time
- `app/data/corruption-data.ts` — Accessor functions for the generated JSON

### App Structure
- `app/page.tsx` — Dashboard with interactive EU heat map and stats
- `app/country/[slug]/page.tsx` — 27 static country detail pages (generateStaticParams for SSG)
- `app/components/` — UI components (eu-map, case-list, case-item, header, stats-bar, etc.)
- `app/lib/types.ts` — TypeScript interfaces for all data shapes
- `app/lib/constants.ts` — EU country slug→name→ISO mapping (Eurostat convention: Greece=EL)
- `app/lib/colors.ts` — d3 color scale configuration for heat map
- `public/eu-topo.json` — Eurostat NUTS0 GeoJSON (72 countries, 27 EU filtered at render time)

### Key Libraries
- `@vnedyalk0v/react19-simple-maps` — React 19-compatible SVG map (client component, loaded with ssr:false)
- `d3-scale` + `d3-scale-chromatic` — Sequential color scale (interpolateOrRd)
- `unified` + `remark-parse` + `unist-util-visit` — Markdown AST parsing
- `shadcn/ui` — Card, Badge, Tooltip, Separator, ScrollArea, Button components

## Key Conventions

- **Path alias:** `@/*` maps to project root for imports
- **Styling:** Glassmorphism dark theme — always dark background with frosted glass panels. Custom CSS classes: `.glass`, `.glass-card`, `.glass-strong`, `.map-glass`, `.glow-hover`
- **ESLint:** Flat config format (`eslint.config.mjs`) extending `core-web-vitals` and `typescript` rulesets
- **Images:** Use `next/image` component, not `<img>` tags
- **Map component:** Must be loaded client-side only (ssr:false via eu-map-wrapper.tsx) because Geographies fetches GeoJSON at runtime
- **Greece edge case:** Eurostat uses ISO code `EL`, not `GR`. Handled in constants.ts
