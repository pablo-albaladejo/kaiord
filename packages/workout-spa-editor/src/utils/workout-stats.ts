/**
 * Workout Statistics Utilities
 *
 * Calculates total duration, distance, and other statistics for workouts.
 *
 * Requirements:
 * - Requirement 9: Calculate workout statistics including repetition blocks
 */

import type { Duration } from "../types/krd";

// ============================================
// Types
// ============================================

export type WorkoutStats = {
  totalDuration: number | null; // seconds, null if cannot be calculated
  totalDistance: number | null; // meters, null if cannot be calculated
  hasOpenSteps: boolean; // true if workout contains open-ended steps
  stepCount: number; // total number of individual steps (including repeated)
  repetitionCount: number; // number of repetition blocks
};

// ============================================
// Duration Calculation
// ============================================

/**
 * Calculate duration in seconds for a single step
 * Returns null if duration cannot be determined (open, conditional, etc.)
 */
const calculateStepDuration = (duration: Duration): number | null => {
  switch (duration.type) {
    case "time":
      return duration.seconds;
    case "repeat_until_time":
      return duration.seconds;
    case "open":
    case "heart_rate_less_than":
    case "repeat_until_heart_rate_greater_than":
    case "repeat_until_heart_rate_less_than":
    case "power_less_than":
    case "power_greater_than":
    case "repeat_until_power_less_than":
    case "repeat_until_power_greater_than":
    case "calories":
    case "repeat_until_calories":
    case "distance":
    case "repeat_until_distance":
      return null;
    default:
      return null;
  }
};

/**
 * Calculate distance in meters for a single step
 * Returns null if distance cannot be determined
 */
const calculateStepDistance = (duration: Duration): number | null => {
  switch (duration.type) {
    case "distance":
      return duration.meters;
    case "repeat_until_distance":
      return duration.meters;
    case "time":
    case "repeat_until_time":
    case "open":
    case "heart_rate_less_than":
    case "repeat_until_heart_rate_greater_than":
    case "repeat_until_heart_rate_less_than":
    case "power_less_than":
    case "power_greater_than":
    case "repeat_until_power_less_than":
    case "repeat_until_power_greater_than":
    case "calories":
    case "repeat_until_calories":
      return null;
    default:
      return null;
  }
};

/**
 * Check if a duration is open-ended (cannot be precisely calculated)
 */
const isOpenDuration = (duration: Duration): boolean => {
  return (
    duration.type === "open" ||
    duration.type === "heart_rate_less_than" ||
    duration.type === "repeat_until_heart_rate_greater_than" ||
    duration.type === "repeat_until_heart_rate_less_than" ||
    duration.type === "power_less_than" ||
    duration.type === "power_greater_than" ||
    duration.type === "repeat_until_power_less_than" ||
    duration.type === "repeat_until_power_greater_than"
  );
};

// ============================================
// Statistics Calculation
// ============================================

/**
 * Calculate statistics for a workout step
 */
const calculateStepStats = (
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
const calculateRepetitionStats = (
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

/**
 * Calculate comprehensive statistics for a workout
 *
 * Requirements:
 * - 9.1: Calculate total workout duration
 * - 9.2: Calculate total distance for distance-based steps
 * - 9.3: Include repetition blocks in calculations
 * - 9.4: Indicate when totals are estimates (open-ended steps)
 */
export const calculateWorkoutStats = (
  workout: Workout | null
): WorkoutStats => {
  if (!workout || !workout.steps || workout.steps.length === 0) {
    return {
      totalDuration: null,
      totalDistance: null,
      hasOpenSteps: false,
      stepCount: 0,
      repetitionCount: 0,
    };
  }

  let totalDuration = 0;
  let totalDistance = 0;
  let hasOpenSteps = false;
  let canCalculateDuration = true;
  let canCalculateDistance = true;
  let stepCount = 0;
  let repetitionCount = 0;

  for (const item of workout.steps) {
    if (isRepetitionBlock(item)) {
      repetitionCount++;
      stepCount += item.steps.length * item.repeatCount;

      const blockStats = calculateRepetitionStats(item);

      if (blockStats.hasOpenSteps) {
        hasOpenSteps = true;
      }

      if (blockStats.totalDuration === null) {
        canCalculateDuration = false;
      } else if (canCalculateDuration) {
        totalDuration += blockStats.totalDuration;
      }

      if (blockStats.totalDistance === null) {
        canCalculateDistance = false;
      } else if (canCalculateDistance) {
        totalDistance += blockStats.totalDistance;
      }
    } else {
      stepCount++;

      const stepStats = calculateStepStats(item);

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
  }

  return {
    totalDuration: canCalculateDuration ? totalDuration : null,
    totalDistance: canCalculateDistance ? totalDistance : null,
    hasOpenSteps,
    stepCount,
    repetitionCount,
  };
};
