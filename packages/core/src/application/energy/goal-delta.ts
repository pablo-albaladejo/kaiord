/**
 * Daily calorie delta for a body-composition goal. Pure; no adapter/external
 * deps.
 *
 * Sign convention (established Phase 1): a fat-loss delta is NEGATIVE (eat
 * below maintenance to run a deficit); a muscle-gain delta is POSITIVE (eat
 * above maintenance to run a surplus); `maintain` is exactly 0.
 *
 * Safety caps keep the plan realistic and never starve the athlete:
 * - fat_loss daily deficit is bounded to ~0.75%/week of bodyweight, AND the
 *   resulting `maintenanceKcal + dailyDeltaKcal` never drops below FLOOR_KCAL.
 * - muscle_gain daily surplus is bounded to MUSCLE_SURPLUS_CAP (~0.5 kg/month).
 * When any cap binds the delta is clamped and `capped`/`capReason` explain why.
 * Passing `overrideCap` keeps the raw (unclamped) delta while still flagging
 * `capped`/`overridden`, so the unsafe-goal warning stays on screen.
 */

import type { GoalType } from "../../domain/schemas/health/energy-goal";
import type { ComputeDailyDeltaResult } from "./goal-cap";
import { resolveCap } from "./goal-cap";

export type { ComputeDailyDeltaResult } from "./goal-cap";

/** Energy density of body tissue used to convert weight to kcal. */
const KCAL_PER_KG = 7700;
/** Hard lower bound on planned daily intake (kcal); never go below. */
export const FLOOR_KCAL = 1200;
/** Conservative muscle-gain surplus cap (kcal/day, ~0.5 kg/month). */
export const MUSCLE_SURPLUS_CAP = 400;
/** Max fat-loss rate as a weekly fraction of bodyweight (0.75%/week). */
const MAX_WEEKLY_LOSS_FRACTION = 0.0075;

export type ComputeDailyDeltaInput = {
  goalType: GoalType;
  currentWeightKg: number;
  targetWeightKg: number;
  /** ISO date (YYYY-MM-DD) for the planned horizon. */
  targetDate: string;
  /** ISO date (YYYY-MM-DD) for "now". */
  today: string;
  maintenanceKcal: number;
  /**
   * When true and a safety cap would bind, return the raw (unclamped) delta
   * while still reporting `capped`/`capReason` so callers keep the warning.
   */
  overrideCap?: boolean;
};

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const MS_PER_DAY = 86_400_000;

/** Whole days between two ISO dates, floored to a minimum of 1. */
const daysBetween = (today: string, targetDate: string): number => {
  const from = Date.parse(today);
  const to = Date.parse(targetDate);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new RangeError("computeDailyDelta requires valid ISO dates.");
  }
  return Math.max(1, Math.round((to - from) / MS_PER_DAY));
};

const assertInputs = (input: ComputeDailyDeltaInput): void => {
  if (
    !isPositiveFinite(input.currentWeightKg) ||
    !isPositiveFinite(input.targetWeightKg) ||
    !isPositiveFinite(input.maintenanceKcal)
  ) {
    throw new RangeError(
      "computeDailyDelta requires positive finite weights and maintenanceKcal."
    );
  }
};

const fatLoss = (
  input: ComputeDailyDeltaInput,
  days: number
): ComputeDailyDeltaResult => {
  const totalKcal =
    (input.currentWeightKg - input.targetWeightKg) * KCAL_PER_KG;
  const rawDailyDeficit = totalKcal / days;
  const rateCap =
    (MAX_WEEKLY_LOSS_FRACTION * input.currentWeightKg * KCAL_PER_KG) / 7;
  const floorCap = input.maintenanceKcal - FLOOR_KCAL;
  const maxDeficit = Math.min(rateCap, floorCap);
  return resolveCap({
    capped: rawDailyDeficit > maxDeficit,
    rawDelta: -rawDailyDeficit,
    // `+ 0` normalises a clamped-to-zero deficit from -0 to +0.
    clampedDelta: -Math.max(0, maxDeficit) + 0,
    reason: floorCap < rateCap ? "FLOOR_KCAL floor" : "0.75%/week rate cap",
    overrideCap: input.overrideCap,
  });
};

const muscleGain = (
  input: ComputeDailyDeltaInput,
  days: number
): ComputeDailyDeltaResult => {
  const totalKcal =
    (input.targetWeightKg - input.currentWeightKg) * KCAL_PER_KG;
  const rawDailySurplus = totalKcal / days;
  return resolveCap({
    capped: rawDailySurplus > MUSCLE_SURPLUS_CAP,
    rawDelta: rawDailySurplus,
    clampedDelta: Math.max(0, Math.min(rawDailySurplus, MUSCLE_SURPLUS_CAP)),
    reason: "MUSCLE_SURPLUS_CAP gain-rate cap",
    overrideCap: input.overrideCap,
  });
};

/**
 * Compute the daily calorie delta (signed) for a goal, applying safety caps.
 *
 * @throws RangeError when weights/maintenance are not positive and finite or a
 * date is not parseable.
 */
export const computeDailyDelta = (
  input: ComputeDailyDeltaInput
): ComputeDailyDeltaResult => {
  if (input.goalType === "maintain") {
    return {
      dailyDeltaKcal: 0,
      capped: false,
      capReason: null,
      overridden: false,
    };
  }
  assertInputs(input);
  const days = daysBetween(input.today, input.targetDate);
  return input.goalType === "fat_loss"
    ? fatLoss(input, days)
    : muscleGain(input, days);
};
