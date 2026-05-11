# Legal Benchmarks Explorer

An interactive visualization of the Harvey AI [harvey-labs](https://github.com/harveyai/harvey-labs) legal agent benchmark: 1,182 tasks across 24 practice areas, each with a full pass/fail rubric and reference documents.

## Stack

- Astro 6 (static export) + React islands for interactive bits
- Tailwind 4 (Vite plugin), `@tailwindcss/typography`
- MiniSearch for client-side full-text search
- mammoth + xlsx for build-time document snippet extraction
- Bun for everything (install, scripts, runtime)

## Commands

| Command | What it does |
| --- | --- |
| `bun install` | Install dependencies |
| `git submodule update --init` | Pull the vendored `vendor/harvey-labs` data |
| `bun run data:build` | Walk the submodule, validate every `task.json`, emit `src/data/*.json` + `public/data/index.json`. Set `EXTRACT_SNIPPETS=0` to skip the ~3-minute snippet pass. |
| `bun run data:refresh` | `git submodule update --remote` then `data:build`. |
| `bun run dev` | Astro dev server on `0.0.0.0:4321`. |
| `bun run build` | Run `data:build` and produce static `dist/`. |
| `bun run preview` | Serve `dist/` locally for smoke testing. |

The dev server binds to `0.0.0.0` so the Claude preview tool (which connects via IPv4) can reach it. Don't change to `localhost`.

## Data pipeline

`scripts/build-data.ts` is the single source of truth.

1. Walk `vendor/harvey-labs/tasks/<practice-area>/<task-slug>/[scenario-NN/]task.json`.
2. Parse each with the Zod schema in `src/lib/schema.ts`. Schema errors fail the build loudly.
3. For each document in the task's `documents/` folder, extract a ~280-char snippet with `scripts/extract-docs.ts` (mammoth for `.docx`, file body for `.eml`/`.txt`/`.md`, sheet summary for `.xlsx`).
4. Emit:
   - `src/data/tasks/<id>.json` (full per-task record, ~30 KB each, ~46 MB total)
   - `src/data/index.json` (slim entries for listings, ~655 KB)
   - `src/data/categories.json` (per-practice-area summaries with work-type histograms)
   - `src/data/summary.json` (top-level stats including upstream SHA)
   - `public/data/index.json` (same as `src/data/index.json`, fetched by the search box at runtime)

The submodule is pinned to a SHA so document `githubUrl`s remain stable between refreshes.

## Schema

Defined in `src/lib/types.ts`. The shapes are:

- `Task` — full task: title, work_type, tags, instructions, deliverables, criteria, documents, pinned `githubUrl`.
- `Criterion` — `{ id, title, deliverables[], matchCriteria }`. Each task averages ~60 criteria, all pass/fail.
- `DocumentEntry` — filename, ext, size, GitHub URL, optional `snippet` (first ~280 chars).
- `SearchIndexEntry` — slim subset (title, tags, practice area, work type, counts) for listings and search.
- `PracticeAreaSummary` — slug, name, task count, scenario count, doc count, work-type histogram, top tags.

`work_type` is one of `analyze | draft | review | research`. Practice area display names live in `src/lib/practice-areas.ts`.

## Routes

- `/` — landing with stats and top practice areas.
- `/practice-areas` — alphabetical grid of all 24.
- `/practice-areas/<area>` — task list with React filter bar (search / work type / tag).
- `/practice-areas/<area>/<task>[--<scenario>]` — task detail (instructions, deliverables, rubric, documents).
- `/biglaw-bench` — short explainer for Harvey's older single-prompt benchmark with links to public samples.
- `/about` — provenance, license, attribution.

The `[task].astro` route uses `import.meta.glob('/src/data/tasks/*.json', { eager: true })` to bundle every task JSON at build time and look up by ID derived from `Astro.params`. Don't switch back to dynamic `import()` or `readFile` — Vite's chunked output relocates `import.meta.url` and breaks the build.

## React islands

- `RubricList.tsx` — collapsible criteria with filter by deliverable.
- `FilterBar.tsx` — search / work-type / tag filter on practice-area pages.
- `SearchBox.tsx` — global header search. Lazy-loads `/data/index.json` on first focus, indexes with MiniSearch (boost title 3x, fuzzy 0.15, prefix match). ⌘K focuses it.

## Deploy

Static export to Cloudflare Pages. Build command: `bun run build`, output: `dist/`. The submodule is checked out by CI when "submodules: true" is enabled in the Pages project settings. Refresh cadence is whatever the operator wants — `bun run data:refresh` updates the submodule and rebuilds.

## Notes

- Documents are **not** redistributed. Every `githubUrl` points back to the pinned upstream SHA. GitHub renders `.docx`/`.xlsx`/`.pdf` natively in their viewer, which is why we don't ship an in-page document viewer.
- `task.json` files use `match_criteria` (snake case) and `work_type` (snake case) upstream; we normalize to `matchCriteria` and `workType` in our types.
- **Tailwind v4 cascade-layer gotcha**: any global element-selector overrides in `src/styles/global.css` (e.g. `a { color: inherit }`) MUST be wrapped in `@layer base { … }`. `@import "tailwindcss"` puts utilities in the `utilities` layer, and *unlayered* CSS beats every layered style regardless of selector specificity — so an unlayered `a { color: inherit }` will silently kill `text-white` (or any `text-*`) on every `<a>` tag, including dark CTA buttons. Symptom: button appears as a solid filled rectangle with invisible text.
- Astro dev mode caches errors aggressively in its HMR overlay. If you see a "ghost" error after fixing the underlying issue, restart `bun run dev` and clear `.astro/` and `node_modules/.vite/`.
