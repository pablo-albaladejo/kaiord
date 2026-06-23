/**
 * Pure formatting of a `DayEnergyBalance` (+ optional goal context) into the
 * compact strings the `EnergyBalanceCard` renders. No React; unit-tested in
 * isolation.
 */

import type { DayEnergyBalance } from "@kaiord/core";

import type { DayEnergyGoalContext } from "../../../application/energy/day-energy-balance-result";

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

const CAP_WARNING_TEXT =
  "Goal capped to a safe rate — adjust the target date if you want faster progress.";
const CAP_OVERRIDDEN_TEXT =
  "Goal exceeds the safe rate — you chose to override the cap.";

const capWarning = (goal: DayEnergyGoalContext | null): string | null => {
  if (!goal?.capped) return null;
  return goal.overridden ? CAP_OVERRIDDEN_TEXT : CAP_WARNING_TEXT;
};

const kcal = (value: number): string => `${Math.round(value)} kcal`;

const SOURCE_LABEL: Record<DayEnergyBalance["source"], string> = {
  measured: "Measured",
  predicted: "Predicted",
  mixed: "Mixed",
};

const netTone = (net: number | null): EnergyBalanceViewModel["netTone"] => {
  if (net === null) return "unknown";
  if (net < 0) return "deficit";
  if (net > 0) return "surplus";
  return "even";
};

const netLabel = (net: number | null): string => {
  if (net === null) return "—";
  if (net < 0) return `${kcal(-net)} deficit`;
  if (net > 0) return `${kcal(net)} surplus`;
  return "balanced";
};

export const toEnergyBalanceViewModel = (
  balance: DayEnergyBalance,
  goal: DayEnergyGoalContext | null = null
): EnergyBalanceViewModel => ({
  expenditure: kcal(balance.expenditure_kcal),
  expenditureLabel: SOURCE_LABEL[balance.source],
  intake:
    balance.intake_kcal === null ? "Untracked" : kcal(balance.intake_kcal),
  net: netLabel(balance.net_kcal),
  netTone: netTone(balance.net_kcal),
  target: balance.target_kcal === null ? null : kcal(balance.target_kcal),
  capWarning: capWarning(goal),
});
