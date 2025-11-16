import type { RepetitionBlock, WorkoutStep } from "../types/krd";
import { isRepetitionBlock } from "../types/krd";
import {
  calculateRepetitionStats,
  calculateStepStats,
} from "./workout-stats-helpers";
import type { StatsAccumulator, WorkoutStats } from "./workout-stats-types";

export const processItem = (
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

export const updateAccumulator = (
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
