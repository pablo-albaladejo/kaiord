import type { Locale } from "@kaiord/i18n";
import type uPlot from "uplot";

import type { Units } from "../../../../lib/units/units";
import { themedAxis } from "../../../charts/uplot-base/chart-theme";
import { seriesStroke } from "../../../charts/uplot-base/series-strokes";
import { formatPaneValue } from "./format-pane-value";
import type { TrendMetricDef } from "./trend-metrics";
import {
  type TrendWindow,
  trendXAxis,
  trendXScale,
  trendXSeries,
} from "./trend-x-axis";

const tickFormatter =
  (metric: TrendMetricDef, units: Units, locale: Locale) =>
  (_u: uPlot, splits: number[]): string[] =>
    splits.map((v) => formatPaneValue(metric, v, units, locale));

const legendFormatter =
  (metric: TrendMetricDef, units: Units, locale: Locale) =>
  (_u: uPlot, v: number | null | undefined): string =>
    formatPaneValue(metric, v, units, locale);

// A health metric is not a training zone, so the series are told apart by
// lightness, dash and label — never by hue. The step is the metric's own
// (see trend-metrics), so it does not shift as metrics are toggled.
const buildTrendSeries = (
  metrics: ReadonlyArray<TrendMetricDef>,
  units: Units,
  locale: Locale,
  window?: TrendWindow
): uPlot.Series[] => {
  const series: uPlot.Series[] = [trendXSeries(locale, window)];
  for (const m of metrics)
    series.push({
      label: m.label,
      scale: m.key,
      stroke: seriesStroke(m.strokeStep),
      ...(m.dash ? { dash: m.dash } : {}),
      value: legendFormatter(m, units, locale),
    });
  return series;
};

export const buildTrendChartOptions = (
  metrics: ReadonlyArray<TrendMetricDef>,
  units: Units = "metric",
  locale: Locale = "en",
  window?: TrendWindow
): uPlot.Options => {
  const scales: uPlot.Scales = trendXScale(window);
  for (const m of metrics) scales[m.key] = { auto: true };

  const axes: uPlot.Axis[] = [trendXAxis(locale)];
  for (const m of metrics)
    axes.push(
      themedAxis({
        scale: m.key,
        side: 1,
        label: m.label,
        values: tickFormatter(m, units, locale),
      })
    );

  const series = buildTrendSeries(metrics, units, locale, window);

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
