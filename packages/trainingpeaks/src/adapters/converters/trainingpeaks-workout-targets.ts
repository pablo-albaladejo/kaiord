import type { Logger, Target } from "@kaiord/core";

import type { TrainingPeaksIntensityMetric } from "../schemas/trainingpeaks-workout.schema";
import type {
  BandRecipe,
  KrdTargetValue,
  TargetBand,
} from "./trainingpeaks-target-band";
import {
  FIVE_ZONE_PERCENT,
  POWER_ZONE_PERCENT_FTP,
  toTargetBand,
} from "./trainingpeaks-target-band";

/**
 * Which TrainingPeaks threshold each KRD target family maps onto, and with
 * what units. Cadence, stroke-type and open targets map onto nothing —
 * TrainingPeaks structured workouts have no field to hold them.
 */

export type TrainingPeaksThresholds = {
  ftpWatts?: number;
  maxHeartRateBpm?: number;
  thresholdPaceMps?: number;
};

/** Sentinel for a family with no already-percentage unit (pace has none). */
const NO_PASSTHROUGH_UNIT = "\0";

type ResolvedTarget = {
  metric: TrainingPeaksIntensityMetric;
  recipe: BandRecipe;
  /** The narrowed KRD value, carried out so callers need no cast. */
  value: KrdTargetValue;
};

const recipeFor = (
  target: Target,
  thresholds: TrainingPeaksThresholds
): ResolvedTarget | undefined => {
  if (target.type === "power") {
    return {
      metric: "percentOfFtp",
      value: target.value,
      recipe: {
        passthroughUnit: "percent_ftp",
        zonePercents: POWER_ZONE_PERCENT_FTP,
        threshold: thresholds.ftpWatts,
        label: "power",
      },
    };
  }
  if (target.type === "heart_rate") {
    return {
      metric: "percentOfMaxHr",
      value: target.value,
      recipe: {
        passthroughUnit: "percent_max",
        zonePercents: FIVE_ZONE_PERCENT,
        threshold: thresholds.maxHeartRateBpm,
        label: "heart-rate",
      },
    };
  }
  if (target.type === "pace") {
    return {
      metric: "percentOfThresholdPace",
      value: target.value,
      recipe: {
        passthroughUnit: NO_PASSTHROUGH_UNIT,
        zonePercents: FIVE_ZONE_PERCENT,
        threshold: thresholds.thresholdPaceMps,
        label: "pace",
      },
    };
  }
  return undefined;
};

/** The metric a KRD target maps onto, or `undefined` when it maps onto none. */
export const metricForTarget = (
  target: Target,
  thresholds: TrainingPeaksThresholds = {}
): TrainingPeaksIntensityMetric | undefined =>
  recipeFor(target, thresholds)?.metric;

/**
 * Convert one KRD target to a TrainingPeaks intensity band, or `undefined`
 * when TrainingPeaks cannot express it. Every drop and every zone collapse is
 * announced through the logger per `spec/conversion-loss-honesty`.
 */
export const targetToBand = (
  target: Target,
  thresholds: TrainingPeaksThresholds,
  logger: Logger | undefined,
  context: Record<string, unknown>
): TargetBand | undefined => {
  const resolved = recipeFor(target, thresholds);
  if (!resolved) {
    logger?.warn(
      `Lossy conversion: dropped ${target.type} target — TrainingPeaks structured workouts carry no such target`,
      context
    );
    return undefined;
  }
  return toTargetBand(resolved.value, resolved.recipe, logger, context);
};
