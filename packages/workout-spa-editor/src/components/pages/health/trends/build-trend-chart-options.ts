import type { Locale } from "@kaiord/i18n";
import type uPlot from "uplot";

import type { Units } from "../../../../lib/units/units";
import { themedAxis } from "../../../charts/uplot-base/chart-theme";
import { timeXScale } from "../../../charts/uplot-base/uplot-base";
import { formatPaneValue } from "./format-pane-value";
import type { TrendMetricDef } from "./trend-metrics";

// Series stroke stays an explicit constant — legible on both light and dark
// surfaces (see chart-theme.ts). Only axis/grid colors adapt per theme.
const STROKE = "#2563eb";

const tickFormatter =
  (metric: TrendMetricDef, units: Units, locale: Locale) =>
  (_u: uPlot, splits: number[]): string[] =>
    splits.map((v) => formatPaneValue(metric, v, units, locale));

const legendFormatter =
  (metric: TrendMetricDef, units: Units, locale: Locale) =>
  (_u: uPlot, v: number | null | undefined): string =>
    formatPaneValue(metric, v, units, locale);

export const buildTrendChartOptions = (
  metrics: ReadonlyArray<TrendMetricDef>,
  units: Units = "metric",
  locale: Locale = "en"
): uPlot.Options => {
  const scales: uPlot.Scales = timeXScale();
  for (const m of metrics) scales[m.key] = { auto: true };

  const axes: uPlot.Axis[] = [themedAxis()];
  for (const m of metrics)
    axes.push(
      themedAxis({
        scale: m.key,
        side: 1,
        label: m.label,
        values: tickFormatter(m, units, locale),
      })
    );

  const series: uPlot.Series[] = [{}];
  for (const m of metrics)
    series.push({
      label: m.label,
      scale: m.key,
      stroke: STROKE,
      value: legendFormatter(m, units, locale),
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
