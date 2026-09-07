import type { KRD, Logger, Sport, Workout } from "@kaiord/core";
import { extractWorkout } from "@kaiord/core";

import type {
  TrainingPeaksBlock,
  TrainingPeaksIntensityMetric,
  TrainingPeaksStructure,
  TrainingPeaksWorkout,
} from "../schemas/trainingpeaks-workout.schema";
import {
  trainingPeaksStructureSchema,
  trainingPeaksWorkoutSchema,
} from "../schemas/trainingpeaks-workout.schema";
import { buildPolyline, totalSeconds } from "./trainingpeaks-workout-polyline";
import { toTrainingPeaksStep } from "./trainingpeaks-workout-steps";
import type { TrainingPeaksThresholds } from "./trainingpeaks-workout-targets";
import { metricForTarget } from "./trainingpeaks-workout-targets";

/**
 * KRD workout → `POST /fitness/v6/athletes/{athleteId}/workouts` body.
 *
 * Pure and offline; the bridge owns the transport. Two wire quirks are handled
 * here because nothing else can: `structure` is serialised to a STRING (the
 * API returns it as an object but will not accept one), and a block's
 * `length.value` carries its repeat count rather than a duration.
 */

/** TrainingPeaks `workoutTypeValueId`. Anything unmapped falls back to Other. */
const WORKOUT_TYPE_OTHER = 100;
const WORKOUT_TYPE_BY_SPORT: Partial<Record<Sport, number>> = {
  swimming: 1,
  cycling: 2,
  e_biking: 2,
  running: 3,
  walking: 3,
  hiking: 3,
  rowing: 4,
  training: 9,
  fitness_equipment: 9,
};

/** Chosen when no step carries a target TrainingPeaks can express. */
const FALLBACK_INTENSITY_METRIC: TrainingPeaksIntensityMetric = "percentOfFtp";

export type KrdToTrainingPeaksWorkoutOptions = {
  athleteId: number;
  /** `YYYY-MM-DD`. Beyond the account's planning horizon the API answers 402. */
  workoutDay: string;
  thresholds?: TrainingPeaksThresholds;
  title?: string;
  logger?: Logger;
};

const isRepetition = (
  entry: Workout["steps"][number]
): entry is Extract<Workout["steps"][number], { repeatCount: number }> =>
  "repeatCount" in entry;

/** The metric of the first expressible target; everything is relative to it. */
const resolveIntensityMetric = (
  workout: Workout,
  thresholds: TrainingPeaksThresholds
): TrainingPeaksIntensityMetric => {
  for (const entry of workout.steps) {
    const steps = isRepetition(entry) ? entry.steps : [entry];
    for (const step of steps) {
      const metric = metricForTarget(step.target, thresholds);
      if (metric) return metric;
    }
  }
  return FALLBACK_INTENSITY_METRIC;
};

const toBlocks = (
  workout: Workout,
  thresholds: TrainingPeaksThresholds,
  logger: Logger | undefined
): TrainingPeaksBlock[] => {
  const blocks: TrainingPeaksBlock[] = [];
  let begin = 0;
  workout.steps.forEach((entry, index) => {
    const source = isRepetition(entry) ? entry.steps : [entry];
    const repeatCount = isRepetition(entry) ? entry.repeatCount : 1;
    const steps = source.map((step, stepIndex) =>
      toTrainingPeaksStep(step, thresholds, logger, {
        blockIndex: index,
        stepIndex,
      })
    );
    const oneRound = steps.reduce((sum, step) => sum + step.length.value, 0);
    const end = begin + oneRound * repeatCount;
    blocks.push({
      type: repeatCount > 1 ? "repetition" : "step",
      length: { value: repeatCount, unit: "repetition" },
      steps,
      begin,
      end,
    });
    begin = end;
  });
  return blocks;
};

/** Build only the `structure` object (the library route accepts it as-is). */
export const krdToTrainingPeaksStructure = (
  krd: KRD,
  thresholds: TrainingPeaksThresholds = {},
  logger?: Logger
): TrainingPeaksStructure => {
  const workout = extractWorkout(krd);
  const blocks = toBlocks(workout, thresholds, logger);
  return trainingPeaksStructureSchema.parse({
    structure: blocks,
    polyline: buildPolyline(blocks),
    primaryLengthMetric: "duration",
    primaryIntensityMetric: resolveIntensityMetric(workout, thresholds),
    primaryIntensityTargetOrRange: "range",
  });
};

export const krdToTrainingPeaksWorkout = (
  krd: KRD,
  options: KrdToTrainingPeaksWorkoutOptions
): TrainingPeaksWorkout => {
  const { athleteId, workoutDay, thresholds = {}, logger } = options;
  const workout = extractWorkout(krd);
  const structure = krdToTrainingPeaksStructure(krd, thresholds, logger);
  return trainingPeaksWorkoutSchema.parse({
    athleteId,
    workoutId: 0,
    workoutDay,
    title: options.title ?? workout.name ?? "",
    description: workout.notes ?? null,
    workoutTypeValueId:
      WORKOUT_TYPE_BY_SPORT[workout.sport] ?? WORKOUT_TYPE_OTHER,
    totalTimePlanned: totalSeconds(structure.structure) / 3600,
    publicSettingValue: 0,
    structure: JSON.stringify(structure),
  });
};
