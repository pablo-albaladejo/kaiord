import type { KRD } from "../../types/krd";
import type { SportThresholds } from "../../types/sport-zones";
import { calculateWorkoutStats } from "../../utils/workout-stats";
import { estimateTss } from "./estimate-tss";
import { formatHms } from "./format-duration";
import { getStructuredWorkout } from "./get-workout";
import { loadLabel } from "./load-label";
import type { ReviewStepItem } from "./step-items";
import { toStepItems } from "./step-items";
import { timeInZone } from "./time-in-zone";

export type ReviewModel = {
  title: string;
  duration: string;
  tss: number;
  load: string;
  dist: number[];
  steps: ReviewStepItem[];
};

/** Derive the review view-model from a generated KRD, or null when absent. */
export function buildReviewModel(
  krd: KRD,
  thresholds: SportThresholds,
  fallbackTitle: string
): ReviewModel | null {
  const workout = getStructuredWorkout(krd);
  if (!workout) return null;

  const stats = calculateWorkoutStats(workout);
  const tss = estimateTss(workout, thresholds);

  return {
    title: workout.name ?? fallbackTitle,
    duration: formatHms(stats.totalDuration ?? 0),
    tss,
    load: loadLabel(tss),
    dist: timeInZone(workout, thresholds),
    steps: toStepItems(workout, thresholds),
  };
}
