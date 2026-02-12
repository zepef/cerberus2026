---
name: update-entity
description: Update entity profiles in entity-data.json with research bot results (profileTitle + profileSummary)
user_invocable: true
---

# Update Entity Profile

Updates one or more entities in `generated/entity-data.json` with `profileTitle` and `profileSummary` fields from research bot results.

## Input format

Arguments are passed as one or more entity updates in the format:

```
/update-entity slug:"individual/kurz-sebastian" title:"Patronage network and perjury" summary:"Former Austrian Chancellor implicated in..."
```

Or as structured JSON for bulk updates:

```
/update-entity [{"slug":"individual/kurz-sebastian","title":"...","summary":"..."},{"slug":"company/danske-bank","title":"...","summary":"..."}]
```

## Instructions

1. Read `generated/entity-data.json`
2. Parse the arguments to extract entity slug(s), title(s), and summary/summaries
3. For each update:
   - Find the entity in `entities[]` by matching `slug`
   - Set `profileTitle` to the provided title
   - Set `profileSummary` to the provided summary
   - Log what was updated
4. Write the updated JSON back to `generated/entity-data.json` (pretty-printed with 2-space indent)
5. Report how many entities were updated and list their names

## Validation

- If a slug is not found, warn and skip it
- Both `title` and `summary` are required per entity
- Title should be concise (under 80 chars)
- Summary should be 1-3 sentences (under 300 chars)

## Example

```
/update-entity slug:"individual/kurz-sebastian" title:"Patronage network and perjury in Austrian politics" summary:"Former Austrian Chancellor implicated in using public funds for manipulated polls, systematic political patronage via the ÖBAG affair, and accused of perjury before parliament. Resigned from politics in 2021."
```
