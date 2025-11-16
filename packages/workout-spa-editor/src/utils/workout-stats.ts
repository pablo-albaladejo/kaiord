import type { Workout } from "../types/krd";
import { processItem } from "./workout-stats-accumulator";
import type { StatsAccumulator, WorkoutStats } from "./workout-stats-types";

export type { WorkoutStats } from "./workout-stats-types";

/**
 * Calculate comprehensive statistics for a workout
 */
export const calculateWorkoutStats = (
  workout: Workout | null
): WorkoutStats => {
  if (!workout?.steps?.length) {
    return {
      totalDuration: null,
      totalDistance: null,
      hasOpenSteps: false,
      stepCount: 0,
      repetitionCount: 0,
    };
  }

  const acc: StatsAccumulator = {
    totalDuration: 0,
    totalDistance: 0,
    hasOpenSteps: false,
    canCalculateDuration: true,
    canCalculateDistance: true,
    stepCount: 0,
    repetitionCount: 0,
  };

  workout.steps.forEach((item) => processItem(item, acc));

  return {
    totalDuration: acc.canCalculateDuration ? acc.totalDuration : null,
    totalDistance: acc.canCalculateDistance ? acc.totalDistance : null,
    hasOpenSteps: acc.hasOpenSteps,
    stepCount: acc.stepCount,
    repetitionCount: acc.repetitionCount,
  };
};
