import { useMemo } from "react";

import type { HealthDateRange } from "../../../../hooks/health/health-live-query";
import { useHealthDailyHistoryLive } from "../../../../hooks/health/use-health-daily-history-live";
import { useHealthHrvHistoryLive } from "../../../../hooks/health/use-health-hrv-history-live";
import { useHealthSleepWeekLive } from "../../../../hooks/health/use-health-sleep-week-live";
import { useHealthWeightHistoryLive } from "../../../../hooks/health/use-health-weight-history-live";
import type { TrendMetricKey } from "./trend-metrics";
import {
  hrvSeries,
  sleepSeries,
  stepsSeries,
  type TrendPoint,
  weightSeries,
} from "./trend-series";

export type TrendSeriesEntry = { points: TrendPoint[]; loading: boolean };

export type TrendSeriesByMetric = Record<TrendMetricKey, TrendSeriesEntry>;

export const useTrendSeries = (
  profileId: string,
  range: HealthDateRange
): TrendSeriesByMetric => {
  const sleep = useHealthSleepWeekLive(profileId, range);
  const hrv = useHealthHrvHistoryLive(profileId, range);
  const weight = useHealthWeightHistoryLive(profileId, range);
  const daily = useHealthDailyHistoryLive(profileId, range);
  return useMemo(
    () => ({
      sleep: { points: sleepSeries(sleep ?? []), loading: sleep === undefined },
      hrv: { points: hrvSeries(hrv ?? []), loading: hrv === undefined },
      weight: {
        points: weightSeries(weight ?? []),
        loading: weight === undefined,
      },
      steps: { points: stepsSeries(daily ?? []), loading: daily === undefined },
    }),
    [sleep, hrv, weight, daily]
  );
};
