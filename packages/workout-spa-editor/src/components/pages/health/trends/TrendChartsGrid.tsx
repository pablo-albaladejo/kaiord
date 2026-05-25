import { TREND_METRICS, type TrendMetricKey } from "./trend-metrics";
import { TrendMetricChart } from "./TrendMetricChart";
import type { TrendSeriesByMetric } from "./use-trend-series";

export type TrendChartsGridProps = {
  selected: ReadonlySet<TrendMetricKey>;
  series: TrendSeriesByMetric;
};

const EMPTY_MSG = "Select at least one metric to see its trend.";

export const TrendChartsGrid = ({ selected, series }: TrendChartsGridProps) => {
  const metrics = TREND_METRICS.filter((m) => selected.has(m.key));
  if (metrics.length === 0)
    return <p className="text-sm text-gray-600">{EMPTY_MSG}</p>;
  return (
    <div className="grid gap-4">
      {metrics.map((metric) => (
        <TrendMetricChart
          key={metric.key}
          metric={metric}
          points={series[metric.key].points}
          loading={series[metric.key].loading}
        />
      ))}
    </div>
  );
};
