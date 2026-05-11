# Legal Benchmarks Explorer

Interactive visualization of [Harvey AI's harvey-labs](https://github.com/harveyai/harvey-labs) legal agent benchmark.

Browse 1,182 tasks across 24 practice areas. Each task has a pass/fail rubric (~60 criteria on average) and a set of real reference documents that an agent is expected to consult.

## Local development

```sh
bun install
git submodule update --init
bun run data:build      # ~3 minutes, walks the benchmark and extracts snippets
bun run dev             # Astro on http://localhost:4321
```

## Architecture and commands

See [`CLAUDE.md`](./CLAUDE.md).

## Attribution

This is an independent, open-source visualization. It is not affiliated with or endorsed by Harvey AI.
