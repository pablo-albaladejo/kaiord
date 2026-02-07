/**
 * Workout Statistics Helper Functions
 *
 * Helper functions for calculating step-level statistics.
 */

import {
  calculateStepDistance,
  calculateStepDuration,
  isOpenDuration,
} from "./workout-stats-duration";
import type { WorkoutStats } from "./workout-stats";
import type { RepetitionBlock, WorkoutStep } from "../types/krd";

/**
 * Calculate statistics for a workout step
 */
export const calculateStepStats = (
  step: WorkoutStep
): Pick<WorkoutStats, "totalDuration" | "totalDistance" | "hasOpenSteps"> => {
  const duration = calculateStepDuration(step.duration);
  const distance = calculateStepDistance(step.duration);
  const hasOpen = isOpenDuration(step.duration);

  return {
    totalDuration: duration,
    totalDistance: distance,
    hasOpenSteps: hasOpen,
  };
};

/**
 * Calculate statistics for a repetition block
 */
export const calculateRepetitionStats = (
  block: RepetitionBlock
): Pick<WorkoutStats, "totalDuration" | "totalDistance" | "hasOpenSteps"> => {
  let totalDuration = 0;
  let totalDistance = 0;
  let hasOpenSteps = false;
  let canCalculateDuration = true;
  let canCalculateDistance = true;

  for (const step of block.steps) {
    const stepStats = calculateStepStats(step);

    if (stepStats.hasOpenSteps) {
      hasOpenSteps = true;
    }

    if (stepStats.totalDuration === null) {
      canCalculateDuration = false;
    } else if (canCalculateDuration) {
      totalDuration += stepStats.totalDuration;
    }

    if (stepStats.totalDistance === null) {
      canCalculateDistance = false;
    } else if (canCalculateDistance) {
      totalDistance += stepStats.totalDistance;
    }
  }

  const finalDuration = canCalculateDuration
    ? totalDuration * block.repeatCount
    : null;
  const finalDistance = canCalculateDistance
    ? totalDistance * block.repeatCount
    : null;

  return {
    totalDuration: finalDuration,
    totalDistance: finalDistance,
    hasOpenSteps,
  };
};
