/**
 * Daily total-energy-expenditure resolution. Pure; no adapter/external deps.
 *
 * Measured device data wins: when a day has ingested wellness calories the
 * expenditure is `activeCalories + restingCalories` (`measured`). Otherwise it
 * is the modeled `bmrKcal + expectedActivityKcal` (`predicted`). The tiered
 * expected-workout-kcal estimator is Phase 4; this function accepts the
 * already-estimated `expectedActivityKcal` as an input.
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
  return {
    basalKcal: input.bmrKcal,
    activityKcal: input.expectedActivityKcal,
    expenditureKcal: input.bmrKcal + input.expectedActivityKcal,
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
