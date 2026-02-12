import type { Logger, RepetitionBlock, WorkoutStep } from "@kaiord/core";
import type {
  GarminWorkoutParsed,
  ParsedRepeatGroup,
} from "../schemas/garmin-workout-parse.schema";
import { mapExecutableStep } from "./executable-step.converter";

export type ParsedSegment = NonNullable<
  GarminWorkoutParsed["workoutSegments"]
>[number];

export const flattenSegmentsToSteps = (
  segments: ParsedSegment[],
  logger: Logger
): Array<WorkoutStep | RepetitionBlock> => {
  const allSteps: Array<WorkoutStep | RepetitionBlock> = [];
  let stepIndex = 0;

  for (const segment of segments) {
    for (const step of segment.workoutSteps ?? []) {
      if (step.type === "RepeatGroupDTO") {
        const block = mapRepeatGroup(step, stepIndex, logger);
        stepIndex += block.steps.length;
        allSteps.push(block);
      } else {
        allSteps.push(mapExecutableStep(step, stepIndex));
        stepIndex++;
      }
    }
  }

  return allSteps;
};

const mapRepeatGroup = (
  group: ParsedRepeatGroup,
  startIndex: number,
  logger: Logger
): RepetitionBlock => {
  const steps: WorkoutStep[] = [];
  let idx = startIndex;

  for (const step of group.workoutSteps) {
    if (step.type === "ExecutableStepDTO") {
      steps.push(mapExecutableStep(step, idx));
      idx++;
    } else {
      logger.warn("Nested repeat groups are flattened", {
        iterations: step.numberOfIterations,
      });
      const nested = mapRepeatGroup(step, idx, logger);
      for (const s of nested.steps) {
        steps.push({ ...s, stepIndex: idx });
        idx++;
      }
    }
  }

  return { repeatCount: group.numberOfIterations, steps };
};
