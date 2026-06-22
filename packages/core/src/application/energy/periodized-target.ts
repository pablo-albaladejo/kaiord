/**
 * Per-day calorie target assembly. Pure; no adapter/external deps.
 *
 * The target is the day's modeled expenditure plus the goal's signed daily
 * delta, floored so it never drops below a safe minimum:
 *   targetKcal = max(floor, bmrKcal + expectedActivityKcal + dailyDeltaKcal)
 *
 * `expectedActivityKcal` is the periodization hook: per-day workout estimates
 * arrive in Phase 4 and will vary the target day-to-day. Until then callers
 * pass 0, which yields a flat target across the horizon — that is expected and
 * not a bug.
 */

import { FLOOR_KCAL } from "./goal-delta";

export type ComputePeriodizedTargetInput = {
  bmrKcal: number;
  /** Per-day expected activity kcal; 0 until Phase 4 wires per-day estimates. */
  expectedActivityKcal: number;
  /** Signed daily delta from `computeDailyDelta` (negative = deficit). */
  dailyDeltaKcal: number;
  /** Lower bound on the target; defaults to FLOOR_KCAL. */
  floorKcal?: number;
};

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const assertInputs = (input: ComputePeriodizedTargetInput): void => {
  if (
    !isFiniteNumber(input.bmrKcal) ||
    !isFiniteNumber(input.expectedActivityKcal) ||
    !isFiniteNumber(input.dailyDeltaKcal)
  ) {
    throw new RangeError(
      "computePeriodizedTarget requires finite bmrKcal, expectedActivityKcal, and dailyDeltaKcal."
    );
  }
};

/**
 * Resolve the floored per-day calorie target from modeled expenditure plus the
 * goal's signed daily delta.
 *
 * @throws RangeError when any kcal input is not finite.
 */
export const computePeriodizedTarget = (
  input: ComputePeriodizedTargetInput
): number => {
  assertInputs(input);
  const floor = input.floorKcal ?? FLOOR_KCAL;
  const raw = input.bmrKcal + input.expectedActivityKcal + input.dailyDeltaKcal;
  return Math.max(floor, raw);
};
