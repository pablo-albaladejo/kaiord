/**
 * Daily total-energy-expenditure resolution. Pure; no adapter/external deps.
 *
 * Measured device data wins: when a day has ingested wellness calories the
 * expenditure is `activeCalories + restingCalories` (`measured`). Otherwise it
 * is the modeled `bmrKcal · neatFactor + expectedActivityKcal` (`predicted`).
 * The `neatFactor` scales BMR for non-exercise daily activity (NEAT); scheduled
 * workouts are still added separately via `expectedActivityKcal`, so they are
 * never double-counted. When `neatFactor` is omitted the basal is BMR alone
 * (factor 1). The tiered expected-workout-kcal estimator is Phase 4; this
 * function accepts the already-estimated `expectedActivityKcal` as an input.
 */

import type { ExpenditureSource } from "../../domain/schemas/health/energy-balance";

/** Ingested device calories for a day, when a connection covers it. */
export type MeasuredWellness = {
  activeCalories: number;
  restingCalories: number;
};

export type DayExpenditureInput = {
  /** Present only when device wellness covers the day. */
  measured?: MeasuredWellness;
  /** Basal metabolic rate (kcal/day) for the predicted fallback. */
  bmrKcal: number;
  /** Estimated activity kcal for the predicted fallback (Phase 4 input). */
  expectedActivityKcal: number;
  /**
   * Non-exercise activity (NEAT) multiplier applied to BMR for the predicted
   * basal. Must be finite and >= 1. Omit to keep the basal at BMR alone.
   */
  neatFactor?: number;
};

export type DayExpenditureResult = {
  basalKcal: number;
  activityKcal: number;
  expenditureKcal: number;
  source: ExpenditureSource;
};

const isNonNegativeFinite = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;

const assertMeasured = (measured: MeasuredWellness): void => {
  if (
    !isNonNegativeFinite(measured.activeCalories) ||
    !isNonNegativeFinite(measured.restingCalories)
  ) {
    throw new RangeError(
      "Measured wellness requires non-negative finite active and resting calories."
    );
  }
};

const assertPredicted = (input: DayExpenditureInput): void => {
  if (
    !isNonNegativeFinite(input.bmrKcal) ||
    !isNonNegativeFinite(input.expectedActivityKcal)
  ) {
    throw new RangeError(
      "Predicted expenditure requires non-negative finite bmrKcal and expectedActivityKcal."
    );
  }
  if (
    input.neatFactor !== undefined &&
    !(Number.isFinite(input.neatFactor) && input.neatFactor >= 1)
  ) {
    throw new RangeError(
      "Predicted expenditure requires a finite neatFactor >= 1 when provided."
    );
  }
};

const resolveMeasured = (measured: MeasuredWellness): DayExpenditureResult => {
  assertMeasured(measured);
  return {
    basalKcal: measured.restingCalories,
    activityKcal: measured.activeCalories,
    expenditureKcal: measured.restingCalories + measured.activeCalories,
    source: "measured",
  };
};

const resolvePredicted = (input: DayExpenditureInput): DayExpenditureResult => {
  assertPredicted(input);
  const basalKcal =
    input.neatFactor === undefined
      ? input.bmrKcal
      : input.bmrKcal * input.neatFactor;
  return {
    basalKcal,
    activityKcal: input.expectedActivityKcal,
    expenditureKcal: basalKcal + input.expectedActivityKcal,
    source: "predicted",
  };
};

/**
 * Resolve a day's total energy expenditure, preferring measured device data
 * over the predicted BMR + expected-activity model.
 */
export const resolveDayExpenditure = (
  input: DayExpenditureInput
): DayExpenditureResult =>
  input.measured ? resolveMeasured(input.measured) : resolvePredicted(input);
