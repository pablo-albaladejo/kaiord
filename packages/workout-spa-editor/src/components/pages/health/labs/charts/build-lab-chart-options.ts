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
import { seriesStroke } from "../../../../charts/uplot-base/series-strokes";
import {
  type ChartMetricDef,
  formatOrEmpty,
  timeXScale,
} from "../../../../charts/uplot-base/uplot-base";
import type { ReferenceBand } from "./reference-band";
import { referenceBandStyle } from "./reference-band-style";

// A lab value out of range is not a training zone, and the danger ramp shares
// zone 5's hue — so the outliers are separated from the value line by a
// lightness step, a point mark and their own legend label, never by red.
const LINE_STEP = 1;
const OUTLIER_STEP = 0;
const OUTLIER_POINT_SIZE = 8;
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
  band: ReferenceBand | null,
  outlierLabel = "Out of range"
): uPlot.Options => {
  const scales: uPlot.Scales = timeXScale();
  scales[def.key] = { auto: true };
  const value = legendValue(def.unit);
  const isBand = band?.kind === "band";
  const lineStroke = seriesStroke(LINE_STEP);
  const outlierStroke = seriesStroke(OUTLIER_STEP);
  const { edgeStroke, fill } = referenceBandStyle(band);

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
      { label: def.label, scale: def.key, stroke: lineStroke, value },
      {
        label: outlierLabel,
        scale: def.key,
        stroke: outlierStroke,
        paths: noLine,
        points: { show: true, size: OUTLIER_POINT_SIZE, fill: outlierStroke },
        value,
      },
      { scale: def.key, stroke: edgeStroke, points: { show: false } },
      { scale: def.key, stroke: edgeStroke, points: { show: false } },
    ],
    bands: isBand ? [{ series: [REF_HIGH_IDX, REF_LOW_IDX], fill }] : undefined,
    legend: { show: true, live: true },
    cursor: { x: true, y: true },
  };
};
