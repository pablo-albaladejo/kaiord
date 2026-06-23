import type uPlot from "uplot";

import type { Units } from "../../../../lib/units/units";
import { formatPaneValue } from "./format-pane-value";
import type { TrendMetricDef } from "./trend-metrics";

const STROKE = "#2563eb";

const tickFormatter =
  (metric: TrendMetricDef, units: Units) =>
  (_u: uPlot, splits: number[]): string[] =>
    splits.map((v) => formatPaneValue(metric, v, units));

const legendFormatter =
  (metric: TrendMetricDef, units: Units) =>
  (_u: uPlot, v: number | null | undefined): string =>
    formatPaneValue(metric, v, units);

export const buildTrendChartOptions = (
  metrics: ReadonlyArray<TrendMetricDef>,
  units: Units = "metric"
): uPlot.Options => {
  const scales: uPlot.Scales = { x: { time: true } };
  for (const m of metrics) scales[m.key] = { auto: true };

  const axes: uPlot.Axis[] = [{}];
  for (const m of metrics)
    axes.push({
      scale: m.key,
      side: 1,
      label: m.label,
      values: tickFormatter(m, units),
    });

  const series: uPlot.Series[] = [{}];
  for (const m of metrics)
    series.push({
      label: m.label,
      scale: m.key,
      stroke: STROKE,
      value: legendFormatter(m, units),
    });

  return {
    width: 0,
    height: 0,
    scales,
    axes,
    series,
    legend: { show: true, live: true },
    cursor: { x: true, y: true },
  };
};
