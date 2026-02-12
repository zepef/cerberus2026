---
name: fetch-and-deploy
description: Fetch all data from botexchange repo, rebuild, commit, and push
user-invocable: true
---

# Fetch and Deploy

Pulls fresh data from `zepef/botexchange` GitHub repo, rebuilds the site, commits any changes, and pushes.

## Instructions

1. Run all three fetch scripts sequentially:
   ```
   npm run fetch-data && npm run fetch-entities && npm run fetch-legislation
   ```
2. Review the fetch output and report counts:
   - Corruption cases (from fetch-data)
   - Entities, resolved connections, Wikipedia images (from fetch-entities)
   - Legislation entries (from fetch-legislation)
3. Run `npm run lint` to verify no errors
4. Run `npx next build` to generate static pages
5. Check `git status` for changes
6. If there are meaningful changes (modified files in `generated/`):
   - Stage the changed files
   - Commit with message: `Update data: {X} entities, {Y} cases, {Z} legislation entries`
   - Push to origin
7. If no changes, report that data is up to date
8. Report final summary: entity count, case count, legislation count, graph nodes/edges, build status

## Notes

- Requires `GITHUB_PAT` in `.env.local`
- The `generated/` directory is gitignored but the build output depends on it
- Build timeout should be generous (5 minutes) as it generates 80+ static pages
- Wikipedia image fetching adds ~30s to entity fetch
- Never commit `.env.local` or other secret files
