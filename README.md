# CERBERUS 2026 — EU Corruption Dashboard

Interactive dashboard tracking corruption cases, entity profiles, and legislative changes across all 27 EU member states. Built with Next.js 16, React 19, and TypeScript.

Data sourced from the [CERBERUS project](https://github.com/zepef/botexchange) — an open-source intelligence database monitoring EU corruption.

## Features

- **Interactive EU Heat Map** — Color-coded by corruption case count per country
- **27 Country Detail Pages** — Cases grouped by time period with status badges
- **53+ Entity Profiles** — Individuals, companies, foreign states, and organizations with Wikipedia images
- **Relationship Graph** — Force-directed network visualization of entity connections
- **Legislative Tracker** — 200+ legislative changes filterable by status, impact, country, and sector
- **Static Site Generation** — All 86 pages pre-rendered at build time for fast loading

## Getting Started

### Prerequisites

- Node.js 20+
- GitHub Personal Access Token (for fetching data from the CERBERUS repository)

### Setup

```bash
# Install dependencies
npm install

# Create environment file
echo "GITHUB_PAT=your_token_here" > .env.local

# Fetch data and start dev server
npm run fetch-data && npm run fetch-entities && npm run fetch-legislation
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Fetch all data + production build |
| `npm run fetch-data` | Fetch corruption case data from GitHub |
| `npm run fetch-entities` | Fetch entity profiles from GitHub |
| `npm run fetch-legislation` | Fetch legislation data from GitHub |
| `npm run lint` | Run ESLint |
| `npm start` | Start production server |

## Architecture

```
app/
├── components/       # UI components (map, graph, cards, filters)
├── data/             # Build-time data accessors with Zod validation
├── lib/              # Types, constants, color scales
├── country/[slug]/   # 27 static country pages
├── entity/[type]/[slug]/  # Entity profile pages
├── entities/         # Entity index with search & filters
├── legislation/      # Legislation index with multi-filter
├── graph/            # Force-directed relationship graph
└── page.tsx          # Dashboard with EU heat map

scripts/
├── lib/github.ts     # Shared GitHub API utilities
├── fetch-data.ts     # Corruption data pipeline
├── fetch-entities.ts # Entity data pipeline
├── fetch-legislation.ts  # Legislation data pipeline
├── parse-markdown.ts # Corruption markdown parser
├── parse-entity.ts   # Entity markdown parser
└── parse-legislation.ts  # Legislation markdown parser
```

### Data Pipeline

At build time, scripts fetch markdown files from the CERBERUS GitHub repository, parse them into structured JSON using unified/remark AST processing, and write to `generated/`. The Next.js app loads this JSON at build time with Zod schema validation and graceful empty-data fallbacks.

### Tech Stack

- **Framework:** Next.js 16 (App Router, SSG)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui
- **Map:** @vnedyalk0v/react19-simple-maps with Eurostat NUTS0 GeoJSON
- **Graph:** react-force-graph-2d (Canvas)
- **Data:** unified + remark-parse for markdown AST, Zod for schema validation
- **Colors:** d3-scale + d3-scale-chromatic (interpolateOrRd)

## License

Private project.
