> Tasks: 40 completed, 0 deferred

## Phase 0 — uPlot axis-stacking probe (pre-code)

- [x] 0.1 Author probe `.omc/research/uplot-axis-probe-2026-05-26.mjs` (jsdom + uPlot ESM via pnpm-store absolute path; module-init guards: matchMedia, Path2D, dispatchEvent, canvas getContext)
- [x] 0.2 Construct 4-axis chart (all `side: 1`) with non-zero `<div>`; wait one `requestAnimationFrame`; read `chart.bbox`, `axes[i]._pos`, `axes[i]._size`
- [x] 0.3 Verdict: **0.A** — auto-stacking works. Positions monotonic 560 / 640 / 720 / 800; plot area 535 px of 880 px canvas
- [x] 0.4 Record outcome in `.omc/research/uplot-axis-probe-2026-05-26.md`; production code uses default uPlot config (no `axes[i].size` overrides, no mixed sides)

## Phase 0.5 — Visual confirmation HARD gate

- [x] 0.5.1 Create worktree at `/private/tmp/kaiord-single-canvas-trends` from `origin/main @ b194022f` on branch `feature/single-canvas-trends-overlay`; verify `git ls-tree HEAD trends/ | wc -l = 26`
- [x] 0.5.2 Implement 3 NEW files + `?card=single` toggle in `HealthDashboardPage.tsx` (predecessor `TrendOverlayCard` preserved)
- [x] 0.5.3 Build workspace deps (`@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`)
- [x] 0.5.4 Start SPA dev server (`pnpm --filter @kaiord/workout-spa-editor dev`); navigate via Playwright MCP to `http://localhost:5173/health?card=single`
- [x] 0.5.5 Capture 6 screenshots at 1024×768 and 375×812 with metrics counts 1/2/3/4 into `.omc/research/single-canvas-screenshots-2026-05-26/`
- [x] 0.5.6 User typed `CONFIRM_PROTOTYPE`; proceed with Phase 2 deletions

## Phase 1 — 3 NEW prod files

- [x] 1.1 `build-trend-chart-data.ts` — pure builder for `uPlot.AlignedData` (xs = sorted union; ys filled with `null` per absent metric); ≤60 logical lines; achieved 23
- [x] 1.2 `build-trend-chart-options.ts` — pure builder for `uPlot.Options` (N+1 axes, all Y on `side: 1`, uniform `#2563eb` stroke, `formatPaneValue(metric, v)` tick + legend formatters, `legend: { show: true, live: true }`); ≤60 logical lines; achieved 51
- [x] 1.3 `TrendSingleChartCard.tsx` — React component with empty / Loading / canvas branches; `CHART_WIDTH=880`, `CHART_HEIGHT=360`; ≤100 lines; achieved 79
- [x] 1.4 Verify typecheck + lint clean from worktree
- [x] 1.5 File-size budgets verified via `wc -l` (23 / 51 / 79)

## Phase 2 — Delete predecessor + finalize HealthDashboardPage

- [x] 2.1 Delete 14 predecessor files under `pages/health/trends/` (TrendOverlayCard{.tsx,.test.tsx}, TrendOverlayPane{.tsx,.test.tsx}, TrendOverlayPaneHeader.tsx, EmptyPanePlaceholder{.tsx,.test.tsx}, use-overlay-pane-order{.ts,.test.ts}, use-overlay-pane-dnd{.ts,.test.ts}, build-pane-options{.ts,.test.ts}, trend-overlay-sync.test.ts)
- [x] 2.2 Remove `TrendOverlayCard` import + `?card=single` toggle from `HealthDashboardPage.tsx`; render only `<TrendSingleChartCard>`
- [x] 2.3 `git grep -E 'TrendOverlayCard|TrendOverlayPane|TrendOverlayPaneHeader|EmptyPanePlaceholder|use-overlay-pane-order|use-overlay-pane-dnd|build-pane-options|trend-overlay-sync'` returns ZERO hits
- [x] 2.4 `grep -rE '@dnd-kit/(sortable|core|utilities)' pages/health/trends/` returns ZERO hits
- [x] 2.5 `useDndCardWrapper` orphan grep — confirm preserved consumers outside trends/

## Phase 3 — Tests (AAA, ≥70% coverage)

- [x] 3.1 `build-trend-chart-data.test.ts` — empty presentKeys returns single xs row; merges unique x values across metrics with overlapping dates; fills missing per-x positions with `null`; preserves ascending x ordering on unsorted input
- [x] 3.2 `build-trend-chart-options.test.ts` — N+1 axes (1 X + N Y); Y-axis scale keys match metric keys; Y-series scale keys match metric keys; uniform `#2563eb` stroke; all Y axes on `side: 1`
- [x] 3.3 `TrendSingleChartCard.test.tsx` (mock `UplotChart` via `vi.fn()` returning `data-testid="uplot-chart-mock"`) — bare empty message when no metric selected; `"Loading…"` placeholder while loading with zero points (AC-Loading); options identity changes on rangeDays change (AC7); empty metric filtered out of data; width=880 / height=360 passed through
- [x] 3.4 All test titles start with `should ` (lowercase, space-suffixed)
- [x] 3.5 Every `it()` body contains `// Arrange`, `// Act`, `// Assert` in order separated by blank lines

## Phase 4 — Verification gates

- [x] 4.1 `pnpm --filter @kaiord/workout-spa-editor exec tsc --noEmit` — zero errors
- [x] 4.2 `pnpm --filter @kaiord/workout-spa-editor lint` — zero warnings
- [x] 4.3 `pnpm --filter @kaiord/workout-spa-editor test` — 100% pass, ≥70% coverage
- [x] 4.4 `pnpm --filter @kaiord/workout-spa-editor build` — clean output
- [x] 4.5 `pnpm test:scripts` — R-PIIInterpolation, R-SessionMatchIdShape, no-zustand-writethrough, no-library-dual-mount, R-ItTitleShould, R-ItBodyAAA all green
- [x] 4.6 Post-deletion orphan grep — zero hits
- [x] 4.7 `@dnd-kit` grep scope under `pages/health/trends/` — zero hits

## Phase 5 — OpenSpec artifacts + changeset + ship

- [x] 5.1 `openspec/changes/single-canvas-trends-overlay/proposal.md`
- [x] 5.2 `openspec/changes/single-canvas-trends-overlay/design.md`
- [x] 5.3 `openspec/changes/single-canvas-trends-overlay/tasks.md` (this file)
- [x] 5.4 `openspec/changes/single-canvas-trends-overlay/specs/spa-routing/spec.md` (MODIFIED block; KEEP scenario 1, REPLACE 2, DELETE 3, REPLACE 4, DELETE 5, ADD Loading)
- [x] 5.5 `npx openspec validate single-canvas-trends-overlay` passes
- [x] 5.6 `pnpm lint:specs` passes
- [x] 5.7 `.changeset/single-canvas-trends-overlay.md` with `@kaiord/workout-spa-editor: minor`
- [x] 5.8 Commit with HEREDOC body + Co-Authored-By trailer
- [x] 5.9 Push branch + open PR
- [x] 5.10 Trigger `update-visual-baselines.yml` after PR is up (Linux/chromium)
