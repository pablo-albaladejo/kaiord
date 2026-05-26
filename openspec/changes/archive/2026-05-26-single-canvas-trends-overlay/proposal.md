> Completed: 2026-05-26

> Depends on health-trends-overlay-single-chart

# Health Trends: Single-Canvas Overlay with N Native Y Axes

**Status:** proposed
**Branch:** `feature/single-canvas-trends-overlay`
**Schema:** kaiord

## Why

The user u-turned post-merge on `2026-05-26-health-trends-overlay-single-chart`
(PRs #687 + #689). The stacked-panes architecture shipped earlier today does
not match the user's actual mental model. The intent the user articulated as
"sumando" means lines **accumulating on one canvas as metrics are toggled**,
not panes stacking vertically. Each metric must keep its native unit — there
is no shared 0–100 normalization (sleep score 80 and weight 72 kg cannot share
a Y axis without making both meaningless).

The Phase 0 probe in `.omc/research/uplot-axis-probe-2026-05-26.md` confirmed
branch **0.A — auto-stacking works**: uPlot 1.6.32 packs four `side: 1` axes
at positions 560 / 640 / 720 / 800 inside an 880 px canvas (plot area 535 px,
no overlap). The Phase 0.5 visual gate (user-confirmed prototype) validated
the layout before any predecessor file was deleted.

## What Changes

Replace `TrendOverlayCard` (N stacked uPlot instances synced via
`uPlot.sync`) with `TrendSingleChartCard` — **one** uPlot instance with one
X axis (time, bottom) and **N** Y axes packed on `side: 1` (right edge,
horizontally outward). All series share a uniform stroke `#2563eb`; line
discrimination is by axis label and legend label. No drag-to-reorder; the
canonical order from `TREND_METRICS` is the rendered order. Mobile may be
cramped at N = 4; users accept this trade-off in exchange for native-unit
preservation. The metric selector, range selector, and `useTrendSeries`
hook are unchanged.

- **3 NEW files** under `packages/workout-spa-editor/src/components/pages/health/trends/`:
  - `build-trend-chart-data.ts` — pure builder for `uPlot.AlignedData`
  - `build-trend-chart-options.ts` — pure builder for `uPlot.Options`
    with N + 1 axes and per-metric scale keys
  - `TrendSingleChartCard.tsx` — React component with empty / Loading /
    canvas branches
- **1 EDIT** to `HealthDashboardPage.tsx` (swaps card; drops `?card=single`
  URL ternary; replaces JSDoc preamble).
- **14 DELETIONS** of the predecessor stacked-panes architecture
  (`TrendOverlayCard`, `TrendOverlayPane`, `TrendOverlayPaneHeader`,
  `EmptyPanePlaceholder`, `use-overlay-pane-order`, `use-overlay-pane-dnd`,
  `build-pane-options`, `trend-overlay-sync.test.ts`, and the test siblings
  of the above).
- **Spec delta** on `spa-routing` superseding the predecessor's
  pane-composition wording.

## Capabilities

### Modified Capabilities

- `spa-routing`: rewrites the "Wellness trends hub" requirement to describe
  a single uPlot canvas with N native-unit Y axes packed on side 1.
  Replaces scenarios for cross-pane cursor sync and pane drag-reorder
  (no longer applicable — single canvas has intrinsic cursor; canonical
  order only). Adds a Loading-state scenario.

## Impact

- **Code (SPA only).** 3 new files + 1 edit + 14 deletions in
  `packages/workout-spa-editor/src/components/pages/health/trends/`.
- **No new top-level dependency.** Only uses already-installed `uplot`.
  The `@dnd-kit/*` packages remain — used elsewhere (Workout List,
  Repetition Block) — but no longer imported from the trends folder.
- **No core / adapter / MCP / Dexie changes.** The Dexie live-query
  layer (`useTrendSeries`), the metric selector, and the range selector
  are untouched.
- **Changeset.** `@kaiord/workout-spa-editor` is a private package, but
  per repo convention this proposal ships a minor changeset documenting
  the user-visible behavior shift (line accumulation, Loading literal).
- **Visual-regression baselines shift.** The `/health` route renders a
  visibly different layout (one canvas vs N stacked panes). Trigger
  `update-visual-baselines.yml` (Linux / chromium) after the PR is up.
- **Breaking changes:** none (no public API).
