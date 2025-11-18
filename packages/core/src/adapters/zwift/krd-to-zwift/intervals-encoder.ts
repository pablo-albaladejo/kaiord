import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { detectIntervalType } from "../interval/interval-type-detector";
import { encodeIntervalsT } from "./intervals-t-encoder";
import { convertStepToInterval } from "./step-encoder";

export const convertStepsToZwiftIntervals = (
  steps: Array<WorkoutStep | RepetitionBlock>,
  logger?: Logger
): Record<string, unknown> => {
  const intervals: Record<string, Array<Record<string, unknown>>> = {};

  for (const step of steps) {
    if ("repeatCount" in step) {
      const repetitionBlock = step as RepetitionBlock;
      if (repetitionBlock.steps.length === 2) {
        const intervalsT = encodeIntervalsT(repetitionBlock);

        if (!intervals.IntervalsT) {
          intervals.IntervalsT = [];
        }
        intervals.IntervalsT.push(intervalsT);
      }
    } else {
      const workoutStep = step as WorkoutStep;
      const intervalType = detectIntervalType(workoutStep);
      const interval = convertStepToInterval(workoutStep, intervalType, logger);

      if (!intervals[intervalType]) {
        intervals[intervalType] = [];
      }
      intervals[intervalType].push(interval);
    }
  }

  return intervals;
};
