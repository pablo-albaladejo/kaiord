/**
 * Workout Statistics Utilities
 *
 * Calculates total duration, distance, and other statistics for workouts.
 *
 * Requirements:
 * - Requirement 9: Calculate workout statistics including repetition blocks
 */

import type { RepetitionBlock, Workout, WorkoutStep } from "../types/krd";
import { isRepetitionBlock } from "../types/krd";
import {
  calculateRepetitionStats,
  calculateStepStats,
} from "./workout-stats-helpers";

// ============================================
// Types
// ============================================

export type WorkoutStats = {
  totalDuration: number | null;
  totalDistance: number | null;
  hasOpenSteps: boolean;
  stepCount: number;
  repetitionCount: number;
};

type StatsAccumulator = {
  totalDuration: number;
  totalDistance: number;
  hasOpenSteps: boolean;
  canCalculateDuration: boolean;
  canCalculateDistance: boolean;
  stepCount: number;
  repetitionCount: number;
};

const processItem = (
  item: WorkoutStep | RepetitionBlock,
  acc: StatsAccumulator
): void => {
  if (isRepetitionBlock(item)) {
    acc.repetitionCount++;
    acc.stepCount += item.steps.length * item.repeatCount;
    const stats = calculateRepetitionStats(item);
    updateAccumulator(acc, stats);
  } else {
    acc.stepCount++;
    const stats = calculateStepStats(item);
    updateAccumulator(acc, stats);
  }
};

const updateAccumulator = (
  acc: StatsAccumulator,
  stats: Pick<WorkoutStats, "totalDuration" | "totalDistance" | "hasOpenSteps">
): void => {
  if (stats.hasOpenSteps) acc.hasOpenSteps = true;
  if (stats.totalDuration === null) {
    acc.canCalculateDuration = false;
  } else if (acc.canCalculateDuration) {
    acc.totalDuration += stats.totalDuration;
  }
  if (stats.totalDistance === null) {
    acc.canCalculateDistance = false;
  } else if (acc.canCalculateDistance) {
    acc.totalDistance += stats.totalDistance;
  }
};

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
