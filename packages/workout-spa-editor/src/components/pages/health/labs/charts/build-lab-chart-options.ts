/**
 * uPlot options for a parameter's evolution chart (DoD-2): a temporal x axis,
 * a single canonical y scale keyed by the parameter, the canonical value line,
 * a distinct out-of-range points series (marked from `flag`), and a reference
 * region. A two-sided band fills between two flat edge series; a one-sided
 * threshold draws a single limit line (the absent edge stays null). The `bands`
 * fill is only emitted for a two-sided band; when no reference is resolved the
 * edge rows are null and nothing renders.
 */
import type uPlot from "uplot";

import { themedAxis } from "../../../../charts/uplot-base/chart-theme";
import {
  type ChartMetricDef,
  formatOrEmpty,
  timeXScale,
} from "../../../../charts/uplot-base/uplot-base";
import type { ReferenceBand } from "./reference-band";

// Series strokes stay explicit constants — legible on both light and dark
// surfaces (see chart-theme.ts). Only axis/grid colors adapt per theme.
const LINE_STROKE = "#2563eb";
const OUTLIER_STROKE = "#dc2626";
const BAND_EDGE = "rgba(37, 99, 235, 0.30)";
const BAND_FILL = "rgba(37, 99, 235, 0.10)";
// A one-sided threshold has no fill to carry it, so its edge line is drawn at a
// stronger alpha than a two-sided band's subtle fill edges.
const THRESHOLD_STROKE = "rgba(37, 99, 235, 0.55)";
const REF_HIGH_IDX = 3;
const REF_LOW_IDX = 4;

// A scatter-only series: suppress the connecting line, keep the points.
const noLine: uPlot.Series.PathBuilder = () => null;

const legendValue =
  (unit: string) =>
  (_u: uPlot, v: number | null | undefined): string =>
    formatOrEmpty(v, (n) => (unit ? `${n} ${unit}` : `${n}`));

export const buildLabChartOptions = (
  def: ChartMetricDef,
  band: ReferenceBand | null
): uPlot.Options => {
  const scales: uPlot.Scales = timeXScale();
  scales[def.key] = { auto: true };
  const value = legendValue(def.unit);
  const isBand = band?.kind === "band";
  const edgeStroke = band?.kind === "threshold" ? THRESHOLD_STROKE : BAND_EDGE;

  return {
    width: 0,
    height: 0,
    scales,
    axes: [
      themedAxis(),
      themedAxis({
        scale: def.key,
        side: 1,
        label: def.unit ? `${def.label} (${def.unit})` : def.label,
      }),
    ],
    series: [
      {},
      { label: def.label, scale: def.key, stroke: LINE_STROKE, value },
      {
        label: "Out of range",
        scale: def.key,
        stroke: OUTLIER_STROKE,
        paths: noLine,
        points: { show: true, size: 8, fill: OUTLIER_STROKE },
        value,
      },
      { scale: def.key, stroke: edgeStroke, points: { show: false } },
      { scale: def.key, stroke: edgeStroke, points: { show: false } },
    ],
    bands: isBand
      ? [{ series: [REF_HIGH_IDX, REF_LOW_IDX], fill: BAND_FILL }]
      : undefined,
    legend: { show: true, live: true },
    cursor: { x: true, y: true },
  };
};
