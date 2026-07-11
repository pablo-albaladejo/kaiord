/**
 * Theme-aware axis colors for uPlot charts. Reads the semantic `--ink-muted`
 * / `--edge` custom properties (see src/index.css `:root` / `.dark`) from the
 * live DOM so axis labels, ticks, and grid lines adapt when the `.dark` class
 * toggles on <html>. Series strokes (the blues/reds in build-sparkline.ts,
 * build-lab-chart-options.ts, build-trend-chart-options.ts) stay explicit
 * hex constants on purpose — they're legible on both light and dark surfaces
 * and don't need to shift per theme.
 */
import type uPlot from "uplot";

// Mirrors the :root defaults in src/index.css. Used when running outside a
// browser (SSR, non-DOM test runner) or before the stylesheet has loaded.
const FALLBACK_AXIS_STROKE = "#64748b";
const FALLBACK_GRID_STROKE = "#e2e8f0";

export type ChartAxisColors = {
  stroke: string;
  grid: string;
};

const readCssVar = (name: string, fallback: string): string => {
  if (
    typeof window === "undefined" ||
    typeof window.getComputedStyle !== "function"
  ) {
    return fallback;
  }
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value.length > 0 ? value : fallback;
};

/**
 * Current `--ink-muted` (axis label/tick color) and `--edge` (grid line
 * color) tokens, resolved fresh from the document root at call time.
 */
export const getChartAxisColors = (): ChartAxisColors => ({
  stroke: readCssVar("--ink-muted", FALLBACK_AXIS_STROKE),
  grid: readCssVar("--edge", FALLBACK_GRID_STROKE),
});

/**
 * Applies the current theme's stroke/grid/ticks colors to a uPlot axis,
 * preserving any explicit `grid`/`ticks` overrides already set on `axis`.
 */
export const themedAxis = (axis: uPlot.Axis = {}): uPlot.Axis => {
  const colors = getChartAxisColors();
  return {
    ...axis,
    stroke: colors.stroke,
    grid: { stroke: colors.grid, ...axis.grid },
    ticks: { stroke: colors.grid, ...axis.ticks },
  };
};
