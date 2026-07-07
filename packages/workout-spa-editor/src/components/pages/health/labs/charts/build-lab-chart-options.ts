/**
 * uPlot options for a parameter's evolution chart (DoD-2): a temporal x axis,
 * a single canonical y scale keyed by the parameter, the canonical value line,
 * a distinct out-of-range points series (marked from `flag`), and a reference
 * band filled between two flat edge series. The band is only wired when one is
 * resolved; otherwise the edge rows are null and no `bands` entry is emitted.
 */
import type uPlot from "uplot";

import {
  type ChartMetricDef,
  formatOrEmpty,
  timeXScale,
} from "../../../../charts/uplot-base/uplot-base";
import type { ReferenceBand } from "./reference-band";

const LINE_STROKE = "#2563eb";
const OUTLIER_STROKE = "#dc2626";
const BAND_EDGE = "rgba(37, 99, 235, 0.30)";
const BAND_FILL = "rgba(37, 99, 235, 0.10)";
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

  return {
    width: 0,
    height: 0,
    scales,
    axes: [
      {},
      {
        scale: def.key,
        side: 1,
        label: def.unit ? `${def.label} (${def.unit})` : def.label,
      },
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
      { scale: def.key, stroke: BAND_EDGE, points: { show: false } },
      { scale: def.key, stroke: BAND_EDGE, points: { show: false } },
    ],
    bands: band
      ? [{ series: [REF_HIGH_IDX, REF_LOW_IDX], fill: BAND_FILL }]
      : undefined,
    legend: { show: true, live: true },
    cursor: { x: true, y: true },
  };
};
