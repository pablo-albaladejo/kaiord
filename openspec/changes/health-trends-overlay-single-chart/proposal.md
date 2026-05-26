> Depends on add-health-metrics-to-krd

# Health Trends: Single Overlay Chart with Synchronized Panes

**Status:** proposed
**Branch:** `feature/health-trends-overlay-single-chart`
**Schema:** kaiord

## Why

The Trends Hub at `/editor/health` currently renders N independent chart cards in a CSS grid (`TrendChartsGrid`). Each card mounts its own `UplotChart` instance with its own canvas, axis pair, and zoom state. There is no cross-pane interaction: hovering on Sleep does not move the cursor on HRV; zooming on Weight does not zoom Steps. Users described the grid as feeling fragmented — they want one coherent visualization where all metrics share a temporal reference.

## What Changes

Replace `TrendChartsGrid` (N independent cards) with a single `TrendOverlayCard` containing N vertically-stacked panes — one per selected metric. All panes share an X-cursor and zoom via uPlot's native `uPlot.sync` multi-instance mechanism, keyed per mount. Each pane keeps its own Y axis and unit. Live values at the cursor position are shown through uPlot's built-in `legend.live: true`. Panes are user-reorderable via `@dnd-kit/sortable` (drag handle in the pane header); order is session-local and resets on unmount. Empty panes (no data for the selected range) show a static English placeholder. The metric selector and range selector are unchanged.

## Capabilities

### Modified Capabilities

- `spa-routing`: modifies the "Wellness trends hub is reachable from the header without a primary tab" requirement to specify that the hub renders **one composite `TrendOverlayCard`** with one pane per selected metric (replacing the prior N-card grid wording "renders a chart for each selected metric"), with cross-pane cursor and zoom synchronization via `uPlot.sync`. Adds scenarios for cross-pane cursor sync, pane toggle/reorder order-preservation, and the composite overlay layout.

> **Plan B was triggered:** `openspec validate` rejected a no-`specs/` change (Plan A), requiring at least one delta. The `specs/spa-routing/spec.md` MODIFIED requirement was added as documented in `design.md`.

## Impact

- **Code (SPA only).** Six new files under `packages/workout-spa-editor/src/components/pages/health/trends/`; one 1-line edit to `HealthDashboardPage.tsx`; deletion of `TrendChartsGrid.tsx`, `TrendChartsGrid.test.tsx`, `TrendMetricChart.tsx`, `trend-chart-options.ts`, and `trend-chart-options.test.ts` in Phase 4 cleanup.
- **No new top-level dependency.** `uplot`, `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` are already present in `packages/workout-spa-editor/package.json`.
- **No core / adapter / MCP / Dexie changes.** The Dexie live-query layer (`useTrendSeries`), the metric selector, and the range selector are untouched.
- **Private package — no changeset required.** `@kaiord/workout-spa-editor` is a private package; no changeset is needed by repo convention (mirrors `2026-04-10-cosmetic-polish`). If PR CI complains, add a placeholder changeset with note "internal: SPA Trends overlay refactor; no public-package impact."
- **Visual-regression baselines shift.** The `/health` route renders a different layout. Trigger `update-visual-baselines.yml` (Linux/chromium) as a CI step after the PR is up. Do NOT regenerate locally (same protocol as `2026-05-25-calendar-add-workout-or-wellness`).
- **Breaking changes:** none.
