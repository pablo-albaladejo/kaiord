import { isWorkoutStep } from "../../types/krd";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../types/krd";

export type ExtractedSteps = {
  stepsToWrap: Array<WorkoutStep>;
  remainingSteps: Array<WorkoutStep | RepetitionBlock>;
  insertPosition: number | null;
};

export const extractSteps = (
  workout: Workout,
  selectedIndices: Set<number>
): ExtractedSteps => {
  const stepsToWrap: Array<WorkoutStep> = [];
  const remainingSteps: Array<WorkoutStep | RepetitionBlock> = [];
  let insertPosition: number | null = null;

  workout.steps.forEach((step, index) => {
    if (isWorkoutStep(step) && selectedIndices.has(step.stepIndex)) {
      if (insertPosition === null) {
        insertPosition = index;
      }
      stepsToWrap.push(step);
    } else {
      remainingSteps.push(step);
    }
  });

  return { stepsToWrap, remainingSteps, insertPosition };
};

export const calculateInsertPosition = (
  workout: Workout,
  insertPosition: number,
  selectedIndices: Set<number>
): number => {
  let adjustedPosition = 0;
  for (let i = 0; i < insertPosition; i++) {
    const step = workout.steps[i];
    if (
      !isWorkoutStep(step) ||
      !selectedIndices.has((step as WorkoutStep).stepIndex)
    ) {
      adjustedPosition++;
    }
  }
  return adjustedPosition;
};

export const reindexSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> => {
  let currentIndex = 0;
  return steps.map((step) => {
    if (isWorkoutStep(step)) {
      return { ...step, stepIndex: currentIndex++ };
    }
    return step;
  });
};
