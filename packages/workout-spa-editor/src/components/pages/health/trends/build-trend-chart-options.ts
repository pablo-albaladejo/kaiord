import type { Locale } from "@kaiord/i18n";
import type uPlot from "uplot";

import type { Units } from "../../../../lib/units/units";
import { themedAxis } from "../../../charts/uplot-base/chart-theme";
import { seriesStroke } from "../../../charts/uplot-base/series-strokes";
import { timeXScale } from "../../../charts/uplot-base/uplot-base";
import { formatPaneValue } from "./format-pane-value";
import type { TrendMetricDef } from "./trend-metrics";

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

  // A health metric is not a training zone, so the series are told apart by
  // lightness, dash and label — never by hue. The step is the metric's own
  // (see trend-metrics), so it does not shift as metrics are toggled.
  const series: uPlot.Series[] = [{}];
  for (const m of metrics)
    series.push({
      label: m.label,
      scale: m.key,
      stroke: seriesStroke(m.strokeStep),
      ...(m.dash ? { dash: m.dash } : {}),
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
