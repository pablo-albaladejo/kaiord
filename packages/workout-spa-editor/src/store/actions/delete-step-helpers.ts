/**
 * Helpers for `deleteStepAction` — split to keep the action file under
 * the ≤80-line ESLint max-lines rule.
 */

import type { RepetitionBlock, Workout, WorkoutStep } from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";

export type FoundStep = {
  step: WorkoutStep | RepetitionBlock;
  arrayIndex: number;
};

export const findStepToDelete = (
  workout: Workout,
  stepIndex: number
): FoundStep | null => {
  for (let i = 0; i < workout.steps.length; i++) {
    const step = workout.steps[i];
    if (isWorkoutStep(step) && step.stepIndex === stepIndex) {
      return { step, arrayIndex: i };
    }
  }
  return null;
};

export const filterSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>,
  stepIndex: number
): Array<WorkoutStep | RepetitionBlock> =>
  steps.filter((step) =>
    isWorkoutStep(step) ? step.stepIndex !== stepIndex : true
  );

export const reindexSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>
): Array<WorkoutStep | RepetitionBlock> =>
  steps.map((step, index) =>
    isWorkoutStep(step) ? { ...step, stepIndex: index } : step
  );
