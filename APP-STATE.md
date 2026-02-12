# App State

Last updated: 2026-02-12

## Data (from `zepef/botexchange`)

- **27 EU countries** with corruption news, entities, and legislation
- **209 corruption cases** across all countries
- **53 entities** (41 individuals, 4 companies, 8 foreign states) across 16 countries
- **204 legislation entries** across 27 countries
- **39 Wikipedia images** out of 53 entities
- **69/117 connections resolved**, 39 graph edges

### Countries with entities (16/27)

Austria (5), Belgium (5), Cyprus (2), Denmark (1), France (6), Germany (1), Greece (4), Hungary (7), Italy (6), Malta (4), Poland (1), Portugal (3), Romania (2), Spain (6)

### Countries without entities (11/27)

Bulgaria, Croatia, Czechia, Estonia, Finland, Ireland, Latvia, Lithuania, Luxembourg, Netherlands, Slovakia, Slovenia, Sweden

## Features

- Dashboard with interactive EU heat map and stats
- 27 country detail pages (SSG)
- 52 entity profile pages with Wikipedia photos, bios, cases, CERBERUS summary (profileTitle, profileSummary, whyTracked)
- Filterable entity index and legislation index
- Interactive force-directed relationship graph with draggable nodes and control panel (repulsion, link distance, center pull sliders)
- Glassmorphism dark theme

## Tech Stack

- Next.js 16, React 19, TypeScript 5 (strict), Tailwind CSS 4 + shadcn/ui
- Build-time data pipeline: GitHub API → remark/mdast parsing → JSON → static pages
- Wikipedia PageImages API for entity avatars
- react-force-graph-2d for relationship network
- d3-scale + d3-scale-chromatic for color scales

## Custom Commands

- `/fetch-and-deploy` — Fetch all data from botexchange, rebuild, commit, push
- `/update-entity` — Update entity profiles in entity-data.json with research bot results

## Deployment

- Branch: `master`
- Remote: `github.com/zepef/cerberus2026`
- Deployed via Vercel (auto-deploy on push to master)

## Static Pages (86 total)

- `/` — Dashboard
- `/country/[slug]` — 27 country pages
- `/entities` — Entity index
- `/entity/[type]/[slug]` — 52 entity profiles
- `/graph` — Relationship network
- `/legislation` — Legislation index
