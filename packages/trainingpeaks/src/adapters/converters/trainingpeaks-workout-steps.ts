import type { Intensity, Logger, WorkoutStep } from "@kaiord/core";

import type {
  TrainingPeaksIntensityClass,
  TrainingPeaksIntensityMetric,
  TrainingPeaksStep,
} from "../schemas/trainingpeaks-workout.schema";
import type { TrainingPeaksThresholds } from "./trainingpeaks-workout-targets";
import { targetToBand } from "./trainingpeaks-workout-targets";

/**
 * KRD step → TrainingPeaks step.
 *
 * TrainingPeaks' structured workout is duration-driven and percentage-driven:
 * a step has one length in seconds and one intensity band. KRD is richer on
 * both axes (distance and conditional durations; absolute and zone targets),
 * so this is the lossy boundary and every narrowing announces itself per
 * `spec/conversion-loss-honesty`.
 */

/**
 * Length given to a step whose KRD duration has no seconds — an open step or
 * a conditional (`repeat_until_*`, `power_greater_than`, …). TrainingPeaks
 * rejects a zero length, so the step must carry *some* duration; five minutes
 * is a neutral placeholder the athlete can see and correct, and it is always
 * accompanied by a warning naming the original duration type.
 */
export const ASSUMED_OPEN_STEP_SECONDS = 300;

/** Band used when the KRD target cannot be expressed at all. */
export const UNTARGETED_BAND = { minValue: 0, maxValue: 0 };

/** KRD's seven intensities collapse onto TrainingPeaks' four classes. */
const INTENSITY_CLASS: Record<Intensity, TrainingPeaksIntensityClass> = {
  warmup: "warmUp",
  cooldown: "coolDown",
  rest: "rest",
  recovery: "rest",
  active: "active",
  interval: "active",
  other: "active",
};

const toIntensityClass = (
  intensity: Intensity | undefined
): TrainingPeaksIntensityClass =>
  intensity === undefined ? "active" : INTENSITY_CLASS[intensity];

const toSeconds = (
  step: WorkoutStep,
  logger: Logger | undefined,
  context: Record<string, unknown>
): { seconds: number; open: boolean } => {
  if (step.duration.type === "time") {
    return { seconds: step.duration.seconds, open: false };
  }
  logger?.warn(
    `Lossy conversion: substituted a ${ASSUMED_OPEN_STEP_SECONDS}s placeholder for a ${step.duration.type} duration — TrainingPeaks structured steps are time-based`,
    { ...context, durationType: step.duration.type }
  );
  return { seconds: ASSUMED_OPEN_STEP_SECONDS, open: true };
};

export const toTrainingPeaksStep = (
  step: WorkoutStep,
  thresholds: TrainingPeaksThresholds,
  logger: Logger | undefined,
  context: Record<string, unknown>,
  primaryMetric?: TrainingPeaksIntensityMetric
): TrainingPeaksStep => {
  const { seconds, open } = toSeconds(step, logger, context);
  const band = targetToBand(
    step.target,
    thresholds,
    logger,
    context,
    primaryMetric
  );
  return {
    name: step.name ?? "",
    length: { value: seconds, unit: "second" },
    targets: [band ?? UNTARGETED_BAND],
    intensityClass: toIntensityClass(step.intensity),
    openDuration: open,
  };
};
