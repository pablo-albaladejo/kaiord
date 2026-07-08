import { useMemo } from "react";

import { useUnits } from "../../../../contexts/units-context";
import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import {
  buildTrendChartData,
  type PerMetricPoints,
} from "./build-trend-chart-data";
import { buildTrendChartOptions } from "./build-trend-chart-options";
import { TREND_METRICS, type TrendMetricKey } from "./trend-metrics";
import { UplotChart } from "./UplotChart";
import type { TrendSeriesByMetric } from "./use-trend-series";

const CHART_WIDTH = 880;
const CHART_HEIGHT = 360;
const EMPTY_MSG = "Select at least one metric to see its trend.";
const LOADING_MSG = "Loading…";

const BY_KEY: Record<TrendMetricKey, (typeof TREND_METRICS)[number]> =
  Object.fromEntries(TREND_METRICS.map((m) => [m.key, m])) as Record<
    TrendMetricKey,
    (typeof TREND_METRICS)[number]
  >;

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
  const units = useUnits();
  const locale = useActiveLocale();
  const selectedKeys = TREND_METRICS.map((m) => m.key).filter((k) =>
    selected.has(k)
  );
  const anyLoading = selectedKeys.some((k) => series[k].loading);
  const presentKeys = selectedKeys.filter((k) => series[k].points.length > 0);

  const metrics = useMemo(
    () => presentKeys.map((k) => BY_KEY[k]),
    [presentKeys]
  );
  const seriesByKey = useMemo(() => {
    const obj = {} as PerMetricPoints;
    for (const k of presentKeys) obj[k] = series[k].points;
    return obj;
  }, [presentKeys, series]);
  const options = useMemo(
    () => buildTrendChartOptions(metrics, units, locale),
    [metrics, units, locale]
  );
  const data = useMemo(
    () => buildTrendChartData(presentKeys, seriesByKey),
    [presentKeys, seriesByKey]
  );

  if (selected.size === 0)
    return <p className="text-sm text-gray-600">{EMPTY_MSG}</p>;
  if (anyLoading && presentKeys.length === 0)
    return (
      <p className="text-sm text-gray-600" data-testid="trend-loading">
        {LOADING_MSG}
      </p>
    );

  return (
    <div
      data-testid="trend-single-chart-card"
      data-range-days={rangeDays}
      className="rounded-lg border border-gray-200 p-4 dark:border-slate-800"
    >
      <UplotChart
        key={`${presentKeys.join("-")}-${rangeDays}`}
        options={options}
        data={data}
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
      />
    </div>
  );
};
