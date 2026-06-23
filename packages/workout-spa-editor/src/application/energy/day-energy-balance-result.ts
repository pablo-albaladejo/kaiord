/**
 * Result types for `buildDayEnergyBalance`.
 *
 * A day is either resolvable into a `DayEnergyBalance` view-model, or it is
 * `gated`: the profile lacks the physiological inputs BMR estimation needs
 * (`height`, `birthDate`, `sex`) and the day has no measured wellness to fall
 * back on, so no basal-derived number is shown.
 */

import type { DayEnergyBalance } from "@kaiord/core";

import type { EnergyTargetRecord } from "../../types/energy-target-record";

/** Why a day could not be resolved without a misleading basal estimate. */
export type DayEnergyBalanceGateReason = "profile-incomplete";

/**
 * Active-goal context attached when a goal drives the day target. Exposes the
 * signed daily delta (negative = deficit, positive = surplus) and the safety
 * `capped`/`capReason` flags so the card and chat tool can show the warning.
 *
 * `maintenanceKcal` is the maintenance the periodized target was built on, and
 * `maintenanceIsEstimate` is true when an adaptive (observed-history) estimate
 * replaced the modeled BMR maintenance, so the UI and chat can label it.
 */
export type DayEnergyGoalContext = {
  goalType: EnergyTargetRecord["goalType"];
  dailyDeltaKcal: number;
  capped: boolean;
  capReason: string | null;
  /** True when a cap would have bound but the user overrode it. */
  overridden: boolean;
  /** Maintenance kcal the target was derived against (modeled or adaptive). */
  maintenanceKcal: number;
  /** True when an adaptive estimate replaced the modeled maintenance. */
  maintenanceIsEstimate: boolean;
};

export type GatedDayEnergyBalance = {
  gated: true;
  reason: DayEnergyBalanceGateReason;
};

export type ResolvedDayEnergyBalance = {
  gated: false;
  balance: DayEnergyBalance;
  /** Present when an active goal derived the day's target; else `null`. */
  goal: DayEnergyGoalContext | null;
};

export type DayEnergyBalanceResult =
  | GatedDayEnergyBalance
  | ResolvedDayEnergyBalance;
