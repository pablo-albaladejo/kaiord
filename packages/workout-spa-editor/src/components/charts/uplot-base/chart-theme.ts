/**
 * Theme-aware colors for uPlot charts. Reads semantic custom properties (see
 * src/index.css `:root` / `.dark`) from the live DOM so axis labels, ticks,
 * grid lines — and, via `series-strokes.ts`, the series themselves — adapt
 * when the `.dark` class toggles on <html>. Series are told apart by
 * lightness and label, never by hue: the five hues belong to training zones.
 */
import type uPlot from "uplot";

// Mirrors the :root (light) values the roles resolve to — --ink-muted is
// --text-dim (n-600) and --edge is --border (n-300). Used when running
// outside a browser (SSR, non-DOM test runner) or before the stylesheet has
// loaded.
const FALLBACK_AXIS_STROKE = "#747474";
const FALLBACK_GRID_STROKE = "#d4d4d4";

export type ChartAxisColors = {
  stroke: string;
  grid: string;
};

/**
 * Resolves one theme custom property off the document root, falling back when
 * there is no DOM (SSR, non-browser test runner) or the stylesheet has not
 * loaded yet.
 */
export const readThemeColor = (name: string, fallback: string): string => {
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
  stroke: readThemeColor("--ink-muted", FALLBACK_AXIS_STROKE),
  grid: readThemeColor("--edge", FALLBACK_GRID_STROKE),
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
