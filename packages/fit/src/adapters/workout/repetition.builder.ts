import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import type { FitWorkoutStep } from "../shared/types";
import { mapStep } from "./step.mapper";

export const findRepetitionStepIndices = (
  workoutSteps: Array<FitWorkoutStep>
): Set<number> => {
  const indices = new Set<number>();

  for (let i = 0; i < workoutSteps.length; i++) {
    const step = workoutSteps[i];
    if (
      step.durationType === fitDurationTypeSchema.enum.repeatUntilStepsCmplt
    ) {
      const startIndex = (step.durationStep || 0) as number;
      for (let j = startIndex; j < i; j++) {
        indices.add(j);
      }
    }
  }

  return indices;
};

export const buildWorkoutSteps = (
  workoutSteps: Array<FitWorkoutStep>,
  repetitionStepIndices: Set<number>
): Array<WorkoutStep | RepetitionBlock> => {
  const steps = [];

  for (let i = 0; i < workoutSteps.length; i++) {
    const step = workoutSteps[i];

    if (
      step.durationType === fitDurationTypeSchema.enum.repeatUntilStepsCmplt &&
      step.repeatSteps
    ) {
      const repetitionBlock = buildRepetitionBlock(step, workoutSteps, i);
      steps.push(repetitionBlock);
    } else if (!repetitionStepIndices.has(i)) {
      steps.push(mapStep(step, i));
    }
  }

  return steps;
};

export const buildRepetitionBlock = (
  step: FitWorkoutStep,
  workoutSteps: Array<FitWorkoutStep>,
  currentIndex: number
): RepetitionBlock => {
  const repeatCount = step.repeatSteps!;
  const startIndex = (step.durationStep || 0) as number;
  const repeatedSteps = [];

  for (let j = startIndex; j < currentIndex; j++) {
    repeatedSteps.push(mapStep(workoutSteps[j], j));
  }

  return {
    repeatCount,
    steps: repeatedSteps,
  };
};
