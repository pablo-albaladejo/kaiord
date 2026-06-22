/**
 * Pure helpers for the calendar net-balance badge.
 *
 * `formatNetBadge` renders a day's `net_kcal` (intake − expenditure; negative =
 * deficit, positive = surplus) as a compact signed kcal string. `netForDay`
 * decides whether a resolved day contributes a badge at all: a badge is shown
 * ONLY when the day is resolvable AND has a non-null net (intake logged), so the
 * band never shows a "net" with no net, nor a misleading zero for a day whose
 * expenditure could not be resolved.
 */

import type { DayEnergyBalanceResult } from "../../application/energy/day-energy-balance-result";

const ROUND = Math.round;

export const formatNetBadge = (netKcal: number): string => {
  const rounded = ROUND(netKcal);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}`;
};

/**
 * The badge string for a resolved day, or `null` when no badge should show
 * (gated day, or resolvable day with untracked intake / no net).
 */
export const netForDay = (result: DayEnergyBalanceResult): string | null => {
  if (result.gated) return null;
  const net = result.balance.net_kcal;
  if (net === null) return null;
  return formatNetBadge(net);
};
