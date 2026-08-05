import { useMemo } from "react";

import { useTheme } from "../../../../contexts/ThemeContext";
import { useUnits } from "../../../../contexts/units-context";
import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { type Translate, useTranslate } from "../../../../i18n/use-translate";
import {
  buildTrendChartData,
  type PerMetricPoints,
} from "./build-trend-chart-data";
import { buildTrendChartOptions } from "./build-trend-chart-options";
import {
  TREND_METRICS,
  type TrendMetricDef,
  type TrendMetricKey,
} from "./trend-metrics";
import { UplotChart } from "./UplotChart";
import type { TrendSeriesByMetric } from "./use-trend-series";

const CHART_WIDTH = 880;
const CHART_HEIGHT = 360;

const BY_KEY: Record<TrendMetricKey, TrendMetricDef> = Object.fromEntries(
  TREND_METRICS.map((m) => [m.key, m])
) as Record<TrendMetricKey, TrendMetricDef>;

const pointsByKey = (
  keys: ReadonlyArray<TrendMetricKey>,
  series: TrendSeriesByMetric
): PerMetricPoints => {
  const points = {} as PerMetricPoints;
  for (const key of keys) points[key] = series[key].points;
  return points;
};

// The axis and legend labels reach the user, so they are localized here rather
// than baked into TREND_METRICS.
const localizedMetrics = (
  keys: ReadonlyArray<TrendMetricKey>,
  t: Translate
): TrendMetricDef[] =>
  keys.map((key) => ({ ...BY_KEY[key], label: t(`trends.metric.${key}`) }));

export type TrendSingleChartCardProps = {
  selected: ReadonlySet<TrendMetricKey>;
  series: TrendSeriesByMetric;
  rangeDays: number;
};

export const TrendSingleChartCard = ({
  selected,
  series,
  rangeDays,
}: TrendSingleChartCardProps) => {
  const t = useTranslate("health");
  const units = useUnits();
  const locale = useActiveLocale();
  const { resolvedTheme } = useTheme();
  const selectedKeys = TREND_METRICS.map((m) => m.key).filter((k) =>
    selected.has(k)
  );
  const anyLoading = selectedKeys.some((k) => series[k].loading);
  const presentKeys = selectedKeys.filter((k) => series[k].points.length > 0);

  const metrics = useMemo(
    () => localizedMetrics(presentKeys, t),
    [presentKeys, t]
  );
  const seriesByKey = useMemo(
    () => pointsByKey(presentKeys, series),
    [presentKeys, series]
  );
  const options = useMemo(
    () => buildTrendChartOptions(metrics, units, locale),
    // resolvedTheme forces a rebuild so axis/grid/series colors follow .dark.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics, units, locale, resolvedTheme]
  );
  const data = useMemo(
    () => buildTrendChartData(presentKeys, seriesByKey),
    [presentKeys, seriesByKey]
  );

  if (selected.size === 0)
    return <p className="text-sm text-ink-muted">{t("trends.selectMetric")}</p>;
  if (anyLoading && presentKeys.length === 0)
    return (
      <p className="text-sm text-ink-muted" data-testid="trend-loading">
        {t("common.loading")}
      </p>
    );

  return (
    <div
      data-testid="trend-single-chart-card"
      data-range-days={rangeDays}
      className="flex flex-col gap-3 rounded-2xl border border-edge-soft bg-surface p-4"
    >
      <UplotChart
        key={`${presentKeys.join("-")}-${rangeDays}`}
        options={options}
        data={data}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
      />
      <p className="m-0 text-xs leading-relaxed text-pretty text-ink-muted">
        {t("trends.seriesLegendNote")}
      </p>
    </div>
  );
};
