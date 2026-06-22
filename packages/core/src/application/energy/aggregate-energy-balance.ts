/**
 * Energy-balance roll-up over a range of days. Pure; no adapter/external deps.
 *
 * Aggregates a window of per-day `DayEnergyBalance` view-models (a week, a
 * month, or any span) into totals and averages. Expenditure is always present
 * so it always contributes; intake and net are nullable (a day with no logged
 * intake is untracked, never a silent zero) and are excluded from intake/net
 * sums and from the intake average — `null` is never coerced to `0`.
 *
 * Sign convention follows `DayEnergyBalance`: `net_kcal = intake − expenditure`
 * (negative = deficit, positive = surplus). `totalNetKcal` sums only the days
 * that have a non-null net, mirroring `daysTracked`.
 *
 * `avgExpenditureKcal` divides by `dayCount` (every day has expenditure);
 * `avgIntakeKcal` divides by `daysTracked` (only days with logged intake) and
 * is `null` when no day was tracked, avoiding a divide-by-zero or a misleading
 * zero average.
 */

import type { DayEnergyBalance } from "../../domain/schemas/health/energy-balance";

export type EnergyBalanceRollup = {
  totalExpenditureKcal: number;
  totalIntakeKcal: number;
  totalNetKcal: number;
  avgExpenditureKcal: number;
  avgIntakeKcal: number | null;
  daysTracked: number;
  dayCount: number;
};

const EMPTY_ROLLUP: EnergyBalanceRollup = {
  totalExpenditureKcal: 0,
  totalIntakeKcal: 0,
  totalNetKcal: 0,
  avgExpenditureKcal: 0,
  avgIntakeKcal: null,
  daysTracked: 0,
  dayCount: 0,
};

type RollupTotals = {
  totalExpenditureKcal: number;
  totalIntakeKcal: number;
  totalNetKcal: number;
  daysTracked: number;
};

const accumulate = (
  acc: RollupTotals,
  day: DayEnergyBalance
): RollupTotals => ({
  totalExpenditureKcal: acc.totalExpenditureKcal + day.expenditure_kcal,
  totalIntakeKcal:
    acc.totalIntakeKcal + (day.intake_kcal === null ? 0 : day.intake_kcal),
  totalNetKcal: acc.totalNetKcal + (day.net_kcal === null ? 0 : day.net_kcal),
  daysTracked: acc.daysTracked + (day.intake_kcal === null ? 0 : 1),
});

/**
 * Roll up a range of `DayEnergyBalance` days into totals and averages. An empty
 * range yields zeroed totals with `avgIntakeKcal` of `null`.
 */
export const aggregateEnergyBalance = (
  days: ReadonlyArray<DayEnergyBalance>
): EnergyBalanceRollup => {
  if (days.length === 0) {
    return EMPTY_ROLLUP;
  }
  const totals = days.reduce<RollupTotals>(accumulate, {
    totalExpenditureKcal: 0,
    totalIntakeKcal: 0,
    totalNetKcal: 0,
    daysTracked: 0,
  });
  return {
    ...totals,
    dayCount: days.length,
    avgExpenditureKcal: totals.totalExpenditureKcal / days.length,
    avgIntakeKcal:
      totals.daysTracked === 0
        ? null
        : totals.totalIntakeKcal / totals.daysTracked,
  };
};
