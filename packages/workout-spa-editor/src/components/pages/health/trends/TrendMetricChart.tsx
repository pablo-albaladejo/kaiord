import { useMemo } from "react";

import { buildTrendOptions } from "./trend-chart-options";
import type { TrendMetricDef } from "./trend-metrics";
import { toAlignedData, type TrendPoint } from "./trend-series";
import { UplotChart } from "./UplotChart";

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;

export type TrendMetricChartProps = {
  metric: TrendMetricDef;
  points: TrendPoint[];
  loading: boolean;
};

export const TrendMetricChart = ({
  metric,
  points,
  loading,
}: TrendMetricChartProps) => {
  const options = useMemo(
    () =>
      buildTrendOptions(metric.label, metric.unit, CHART_WIDTH, CHART_HEIGHT),
    [metric.label, metric.unit]
  );
  const data = useMemo(() => toAlignedData(points), [points]);
  return (
    <section
      data-testid={`trend-card-${metric.key}`}
      className="rounded-lg border border-gray-200 p-4 dark:border-slate-800"
    >
      <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        {metric.label}
      </h2>
      <TrendMetricBody
        metricKey={metric.key}
        loading={loading}
        empty={points.length === 0}
        options={options}
        data={data}
      />
    </section>
  );
};

type TrendMetricBodyProps = {
  metricKey: string;
  loading: boolean;
  empty: boolean;
  options: ReturnType<typeof buildTrendOptions>;
  data: ReturnType<typeof toAlignedData>;
};

const TrendMetricBody = ({
  metricKey,
  loading,
  empty,
  options,
  data,
}: TrendMetricBodyProps) => {
  if (loading) return <p className="text-sm text-gray-600">Loading…</p>;
  if (empty)
    return (
      <p
        data-testid={`trend-empty-${metricKey}`}
        className="text-sm text-gray-600"
      >
        No data in the selected range.
      </p>
    );
  return (
    <UplotChart
      options={options}
      data={data}
      width={options.width}
      height={options.height}
    />
  );
};
