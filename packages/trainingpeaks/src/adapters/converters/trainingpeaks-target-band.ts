import type { Logger } from "@kaiord/core";

/**
 * The one shape TrainingPeaks accepts for intensity, and the arithmetic that
 * gets KRD's four unit families there.
 *
 * TrainingPeaks expresses intensity only as a percentage of a threshold, so
 * the three target families (power, heart rate, pace) differ solely in WHICH
 * threshold and WHICH units they arrive in — the branching is identical. This
 * module holds that shared logic once; `trainingpeaks-workout-targets.ts`
 * supplies the per-family table.
 */

export type TargetBand = { minValue: number; maxValue: number };

/**
 * Zone midpoints as a percentage of threshold. A zone is a band and this
 * collapses it to a single number, so every use announces the loss. Power
 * follows Coggan's seven levels; heart rate and pace follow the five-zone
 * model KRD caps at.
 */
export const POWER_ZONE_PERCENT_FTP = [55, 75, 90, 105, 120, 140, 200] as const;
export const FIVE_ZONE_PERCENT = [60, 70, 80, 90, 100] as const;

/** How one KRD target family reaches TrainingPeaks' percentage model. */
export type BandRecipe = {
  /** Unit already expressed as a percentage — passes through untouched. */
  passthroughUnit: string;
  /** Zone midpoints, indexed from zone 1. */
  zonePercents: readonly number[];
  /** The athlete threshold absolute units divide by; `undefined` if unknown. */
  threshold: number | undefined;
  /** Names the quantity in warnings, e.g. "power". */
  label: string;
};

/** KRD target values, narrowed to the shapes every family shares. */
export type KrdTargetValue =
  | { unit: "zone"; value: number }
  | { unit: "range"; min: number; max: number }
  | { unit: string; value: number };

const band = (min: number, max: number): TargetBand => ({
  minValue: Math.round(min),
  maxValue: Math.round(max),
});

const toPercent = (
  value: number,
  recipe: BandRecipe,
  logger: Logger | undefined,
  context: Record<string, unknown>
): number | undefined => {
  if (recipe.threshold === undefined || recipe.threshold <= 0) {
    logger?.warn(
      `Lossy conversion: dropped ${recipe.label} target — no athlete threshold to express it as a percentage`,
      { ...context, value }
    );
    return undefined;
  }
  return (value / recipe.threshold) * 100;
};

/**
 * Map one KRD target value onto a TrainingPeaks band, or `undefined` when it
 * cannot be expressed. `undefined` is a decision for the caller to handle — it
 * is never quietly coerced to zero.
 */
export const toTargetBand = (
  value: KrdTargetValue,
  recipe: BandRecipe,
  logger: Logger | undefined,
  context: Record<string, unknown>
): TargetBand | undefined => {
  if (value.unit === recipe.passthroughUnit && "value" in value) {
    return band(value.value, value.value);
  }
  if (value.unit === "zone" && "value" in value) {
    const percent = recipe.zonePercents[value.value - 1];
    if (percent === undefined) {
      logger?.warn(
        `Lossy conversion: dropped ${recipe.label} target — zone ${value.value} is outside the known zone table`,
        { ...context, zones: recipe.zonePercents.length }
      );
      return undefined;
    }
    logger?.warn(
      `Lossy conversion: collapsed ${recipe.label} zone to its midpoint percentage`,
      { ...context, zone: value.value, assumedPercent: percent }
    );
    return band(percent, percent);
  }
  if (value.unit === "range" && "min" in value) {
    const min = toPercent(value.min, recipe, logger, context);
    const max = toPercent(value.max, recipe, logger, context);
    return min === undefined || max === undefined ? undefined : band(min, max);
  }
  if (!("value" in value)) return undefined;
  const percent = toPercent(value.value, recipe, logger, context);
  return percent === undefined ? undefined : band(percent, percent);
};
