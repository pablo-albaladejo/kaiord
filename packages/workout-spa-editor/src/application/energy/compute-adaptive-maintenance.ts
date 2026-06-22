/**
 * `computeAdaptiveMaintenance` — back-calculates the profile's real maintenance
 * energy from logged intake versus the smoothed weight trend over a rolling
 * window, by composing the SPA roll-up + weight-trend readers with the core
 * `computeAdaptiveTdee` calculator.
 *
 * Inputs over `[asOfDate − windowDays, asOfDate]`:
 *   - average logged daily intake + tracked-day count, from `buildEnergyRollup`
 *   - the EMA-smoothed weight change (last − first), from `buildWeightTrend`
 *
 * Returns `null` when there is no usable data (no tracked intake or fewer than
 * two smoothed weigh-ins to span a change). The returned result carries
 * `sufficientData` so callers only apply the correction past the activation
 * threshold; below it the modeled maintenance stays in use.
 */

import { type AdaptiveTdeeResult, computeAdaptiveTdee } from "@kaiord/core";

import { addDaysIso } from "../../components/pages/Daily/today-dates";
import type { PersistencePort } from "../../ports/persistence-port";
import type { HealthWeightRecord } from "../../types/health/health-records";
import { buildEnergyRollup } from "./build-energy-rollup";
import { buildWeightTrend } from "./build-weight-trend";

/** Default rolling window (days) for the adaptive maintenance estimate. */
export const DEFAULT_ADAPTIVE_WINDOW_DAYS = 28;

export type ComputeAdaptiveMaintenanceInput = {
  persistence: PersistencePort;
  profileId: string;
  /** Inclusive ISO end of the window (YYYY-MM-DD). */
  asOfDate: string;
  /** Rolling window span (days); defaults to 28. */
  windowDays?: number;
};

const smoothedChangeKg = (weighIns: HealthWeightRecord[]): number | null => {
  const trend = buildWeightTrend({ weighIns, target: undefined });
  const first = trend.smoothed.at(0);
  const last = trend.smoothed.at(-1);
  if (!first || !last || first === last) return null;
  return last.value - first.value;
};

export const computeAdaptiveMaintenance = async (
  input: ComputeAdaptiveMaintenanceInput
): Promise<AdaptiveTdeeResult | null> => {
  const windowDays = input.windowDays ?? DEFAULT_ADAPTIVE_WINDOW_DAYS;
  const startDate = addDaysIso(input.asOfDate, -windowDays);
  const [rollup, weighIns] = await Promise.all([
    buildEnergyRollup({
      persistence: input.persistence,
      profileId: input.profileId,
      startDate,
      endDate: input.asOfDate,
    }),
    input.persistence.healthWeight.getByProfileAndDateRange(
      input.profileId,
      startDate,
      input.asOfDate
    ),
  ]);
  if (rollup.avgIntakeKcal === null) return null;
  const weightChangeKg = smoothedChangeKg(weighIns);
  if (weightChangeKg === null) return null;
  return computeAdaptiveTdee({
    avgDailyIntakeKcal: rollup.avgIntakeKcal,
    weightChangeKg,
    windowDays,
    daysWithData: rollup.daysTracked,
  });
};
