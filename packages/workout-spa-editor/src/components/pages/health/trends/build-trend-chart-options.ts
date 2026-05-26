import type uPlot from "uplot";

import { formatPaneValue } from "./format-pane-value";
import type { TrendMetricDef } from "./trend-metrics";

const STROKE = "#2563eb";

const tickFormatter =
  (metric: TrendMetricDef) =>
  (_u: uPlot, splits: number[]): string[] =>
    splits.map((v) => formatPaneValue(metric, v));

const legendFormatter =
  (metric: TrendMetricDef) =>
  (_u: uPlot, v: number | null | undefined): string =>
    formatPaneValue(metric, v);

export const buildTrendChartOptions = (
  metrics: ReadonlyArray<TrendMetricDef>
): uPlot.Options => {
  const scales: uPlot.Scales = { x: { time: true } };
  for (const m of metrics) scales[m.key] = { auto: true };

  const axes: uPlot.Axis[] = [{}];
  for (const m of metrics)
    axes.push({
      scale: m.key,
      side: 1,
      label: m.label,
      values: tickFormatter(m),
    });

  const series: uPlot.Series[] = [{}];
  for (const m of metrics)
    series.push({
      label: m.label,
      scale: m.key,
      stroke: STROKE,
      value: legendFormatter(m),
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
