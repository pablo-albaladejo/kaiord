# Tasks

## 1. Measure

- [x] 1.1 Lighthouse mobile, 3 runs, median, before any change: `/app/`,
      docs `convert/fit-to-tcx`, landing (production and local builds).
- [x] 1.2 Measure the initial JS and `/app/` for baseline, D1 (entry-graph
      seams), D2 (no `codeSplitting.groups`) and D1+D2.

## 2. SPA

- [x] 2.1 `HealthSubRouter` and `NewWorkoutRoute` lazy, inside `guard()`.
- [x] 2.2 Cloud sync behind `import()` via `createLazyCloudSync`, with tests.
- [x] 2.3 `scripts/check-spa-initial-js.mjs` + tests; `pnpm size:spa`; CI
      `size-limit` consumes the SPA build and runs it; kill switch
      documented in the job comment and the runbook.

## 3. Docs font

- [x] 3.1 `vitepress/theme-without-fonts` in the theme and `index.md`.
- [x] 3.2 `copy-brand-font.mjs` in the docs build; `public/fonts/` ignored.
- [x] 3.3 `single-font.test.mjs` (source + dist); wired into the deploy
      docs guard; the deploy smoke requires the font URL to answer 200.
