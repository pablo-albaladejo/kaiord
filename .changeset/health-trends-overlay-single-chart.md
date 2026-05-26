---
"@kaiord/workout-spa-editor": minor
---

Health trends hub: replace the N-independent-chart grid at `/editor/health` with one composite widget of vertically-stacked panes (one per selected metric). Cursor and zoom are synchronized across all panes via `uPlot.sync` so the user perceives "una sola gráfica" while each metric keeps its native Y axis and unit. Each pane shows uPlot's built-in `legend.live` value at the cursor position. Empty panes (selected metric with no data in the active range) render an English placeholder. Panes are user-reorderable by dragging the header (reuses `@dnd-kit/sortable` via the existing `useDndCardWrapper` precedent). The 30/90/365 day range selector and the metric toggle pills are unchanged.

Implementation follows the consensus plan at `.omc/plans/ralplan-health-trends-overlay-single-chart.md` (Planner/Architect/Critic APPROVE iter 2) with the visual-tightness contract: shared X-axis ticks across panes, ≤8 px inter-pane gap, no per-pane border (only the outer card border). The five superseded files (`TrendChartsGrid`, `TrendMetricChart`, `trend-chart-options`, and their tests) are removed.
