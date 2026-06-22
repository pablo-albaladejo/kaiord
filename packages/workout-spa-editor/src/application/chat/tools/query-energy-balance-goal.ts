/**
 * Helpers for `query_energy_balance`: the inclusive day-range iterator and the
 * active-goal context builder.
 *
 * The goal context joins the persisted `EnergyTargetRecord` (goal type, target
 * weight/date) with today's derived `goal` context (signed daily delta, derived
 * target kcal, and the safety cap flags) so the chatbot can answer goal,
 * deficit/surplus, and remaining-kcal questions.
 */

import type { DayEnergyBalanceResult } from "../../energy/day-energy-balance-result";
import type { ReadToolDeps } from "./chat-tool-deps";

const nextDay = (iso: string): string => {
  const next = new Date(`${iso}T00:00:00.000Z`).getTime() + 86_400_000;
  return new Date(next).toISOString().slice(0, 10);
};

export const eachDay = (from: string, to: string): string[] => {
  const days: string[] = [];
  for (let d = from; d <= to; d = nextDay(d)) days.push(d);
  return days;
};

export const buildGoalContext = async (
  deps: ReadToolDeps,
  todayResult: DayEnergyBalanceResult
) => {
  const target = await deps.persistence.energyTargets.get(deps.profileId);
  if (!target) return null;
  const day = !todayResult.gated && todayResult.goal ? todayResult.goal : null;
  const targetKcal = todayResult.gated ? null : todayResult.balance.target_kcal;
  return {
    goal_type: target.goalType,
    target_weight_kg: target.targetWeightKg,
    target_date: target.targetDate,
    daily_delta_kcal: day?.dailyDeltaKcal ?? null,
    target_kcal: targetKcal,
    capped: day?.capped ?? false,
    cap_reason: day?.capReason ?? null,
    // True when the cap bound but the user accepted the unsafe pace; the warning
    // still applies, only the delta is the raw (unclamped) value.
    cap_overridden: day?.overridden ?? false,
    // Adaptive maintenance estimate (logged intake vs weight trend). When it has
    // sufficient history it replaces the modeled maintenance feeding the target.
    maintenance_kcal: day?.maintenanceKcal ?? null,
    maintenance_is_estimate: day?.maintenanceIsEstimate ?? false,
  };
};
