/**
 * Pure formatting of an `EnergyRollup` into the compact strings the trends
 * summary renders. The net total follows the domain sign convention
 * (`net = intake − expenditure`): negative = deficit, positive = surplus.
 */

import type { EnergyRollup } from "../../../../application/energy/build-energy-rollup";

export type EnergyRollupView = {
  avgExpenditure: string;
  avgIntake: string;
  net: string;
  netTone: "deficit" | "surplus" | "even" | "unknown";
  daysTracked: string;
};

const kcal = (value: number): string => `${Math.round(value)} kcal`;

const netTone = (
  total: number,
  daysTracked: number
): EnergyRollupView["netTone"] => {
  if (daysTracked === 0) return "unknown";
  if (total < 0) return "deficit";
  if (total > 0) return "surplus";
  return "even";
};

const netLabel = (total: number, daysTracked: number): string => {
  if (daysTracked === 0) return "—";
  if (total < 0) return `${kcal(-total)} deficit`;
  if (total > 0) return `${kcal(total)} surplus`;
  return "balanced";
};

export const toEnergyRollupView = (rollup: EnergyRollup): EnergyRollupView => ({
  avgExpenditure: kcal(rollup.avgExpenditureKcal),
  avgIntake:
    rollup.avgIntakeKcal === null ? "Untracked" : kcal(rollup.avgIntakeKcal),
  net: netLabel(rollup.totalNetKcal, rollup.daysTracked),
  netTone: netTone(rollup.totalNetKcal, rollup.daysTracked),
  daysTracked: `${rollup.daysTracked}/${rollup.daysInRange} days tracked`,
});
