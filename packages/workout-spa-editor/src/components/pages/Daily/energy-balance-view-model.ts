/**
 * Pure formatting of a `DayEnergyBalance` (+ optional goal context) into the
 * compact strings the `EnergyBalanceCard` renders. No React; unit-tested in
 * isolation.
 */

import type { DayEnergyBalance } from "@kaiord/core";

import type { DayEnergyGoalContext } from "../../../application/energy/day-energy-balance-result";
import { getTranslate, type Translate } from "../../../i18n/use-translate";

export type EnergyBalanceViewModel = {
  expenditure: string;
  expenditureLabel: string;
  intake: string;
  net: string;
  netTone: "deficit" | "surplus" | "even" | "unknown";
  target: string | null;
  /** Non-blocking safety warning when the goal's daily delta was capped. */
  capWarning: string | null;
};

const kcal = (value: number): string => `${Math.round(value)} kcal`;

const capWarning = (
  t: Translate,
  goal: DayEnergyGoalContext | null
): string | null => {
  if (!goal?.capped) return null;
  return goal.overridden
    ? t("energyBalance.capOverridden")
    : t("energyBalance.capWarning");
};

const netTone = (net: number | null): EnergyBalanceViewModel["netTone"] => {
  if (net === null) return "unknown";
  if (net < 0) return "deficit";
  if (net > 0) return "surplus";
  return "even";
};

const netLabel = (t: Translate, net: number | null): string => {
  if (net === null) return "—";
  const value = Math.round(Math.abs(net));
  if (net < 0) return t("energyBalance.deficit", { value });
  if (net > 0) return t("energyBalance.surplus", { value });
  return t("energyBalance.balanced");
};

export const toEnergyBalanceViewModel = (
  balance: DayEnergyBalance,
  goal: DayEnergyGoalContext | null = null,
  t: Translate = getTranslate("daily")
): EnergyBalanceViewModel => ({
  expenditure: kcal(balance.expenditure_kcal),
  expenditureLabel: t(`energyBalance.source.${balance.source}`),
  intake:
    balance.intake_kcal === null
      ? t("energyBalance.untracked")
      : kcal(balance.intake_kcal),
  net: netLabel(t, balance.net_kcal),
  netTone: netTone(balance.net_kcal),
  target: balance.target_kcal === null ? null : kcal(balance.target_kcal),
  capWarning: capWarning(t, goal),
});
