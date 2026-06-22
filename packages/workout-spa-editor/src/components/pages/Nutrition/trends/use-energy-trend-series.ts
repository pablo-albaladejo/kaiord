/**
 * useEnergyTrendSeries — assembles every Nutrition-trends series (weight raw +
 * EMA + goal line, steps, sleep, weekly training time) for a (profileId, range)
 * into the `EnergyTrendSeries` map the chart aligns.
 *
 * Each underlying read is its own live hook; `loading` is true until the core
 * weight trend resolves (the chart's primary series). Overlays default to empty
 * arrays while their reads settle, so the chart never throws on a partial load.
 */
import { useMemo } from "react";

import { useWeeklyTrainingTime } from "../../../../hooks/energy/use-weekly-training-time";
import { useWeightTrend } from "../../../../hooks/energy/use-weight-trend";
import type { HealthDateRange } from "../../../../hooks/health/health-live-query";
import { useHealthDailyHistoryLive } from "../../../../hooks/health/use-health-daily-history-live";
import { useHealthSleepWeekLive } from "../../../../hooks/health/use-health-sleep-week-live";
import {
  asDatedValues,
  type DatedValue,
  type EnergyTrendSeries,
} from "./energy-trend-series";

export type EnergyTrendSeriesState = {
  series: EnergyTrendSeries;
  loading: boolean;
};

export const useEnergyTrendSeries = (
  profileId: string | null,
  range: HealthDateRange
): EnergyTrendSeriesState => {
  const weight = useWeightTrend(profileId, range);
  const daily = useHealthDailyHistoryLive(profileId ?? "", range);
  const sleep = useHealthSleepWeekLive(profileId ?? "", range);
  const training = useWeeklyTrainingTime(profileId, range.start, range.end);

  return useMemo(() => {
    const steps: DatedValue[] = (daily ?? [])
      .filter((r) => Number.isFinite(r.krd.steps))
      .map((r) => ({ date: r.date, value: r.krd.steps }));
    const sleepPoints: DatedValue[] = (sleep ?? [])
      .filter((r) => typeof r.krd.score === "number")
      .map((r) => ({ date: r.date, value: r.krd.score as number }));
    const trainingPoints: DatedValue[] = (training ?? []).map((p) => ({
      date: p.date,
      value: p.minutes,
    }));
    return {
      loading: weight === undefined,
      series: {
        weightRaw: asDatedValues(weight?.raw ?? []),
        weightEma: asDatedValues(weight?.smoothed ?? []),
        goal: asDatedValues(weight?.goalLine ?? []),
        steps,
        sleep: sleepPoints,
        training: trainingPoints,
      },
    };
  }, [weight, daily, sleep, training]);
};
