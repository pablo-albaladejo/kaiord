/**
 * Pure formatting of an `EnergyRollup` into the compact strings the trends
 * summary renders. The net total follows the domain sign convention
 * (`net = intake − expenditure`): negative = deficit, positive = surplus.
 */

import type { EnergyRollup } from "../../../../application/energy/build-energy-rollup";
import { getTranslate, type Translate } from "../../../../i18n/use-translate";

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

const netLabel = (total: number, daysTracked: number, t: Translate): string => {
  if (daysTracked === 0) return "—";
  if (total < 0) return t("trends.deficit", { value: kcal(-total) });
  if (total > 0) return t("trends.surplus", { value: kcal(total) });
  return t("trends.balanced");
};

export const toEnergyRollupView = (
  rollup: EnergyRollup,
  t: Translate = getTranslate("nutrition")
): EnergyRollupView => ({
  avgExpenditure: kcal(rollup.avgExpenditureKcal),
  avgIntake:
    rollup.avgIntakeKcal === null
      ? t("trends.untracked")
      : kcal(rollup.avgIntakeKcal),
  net: netLabel(rollup.totalNetKcal, rollup.daysTracked, t),
  netTone: netTone(rollup.totalNetKcal, rollup.daysTracked),
  daysTracked: t("trends.daysTracked", {
    tracked: rollup.daysTracked,
    range: rollup.daysInRange,
  }),
});
