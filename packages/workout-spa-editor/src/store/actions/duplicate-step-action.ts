/**
 * Duplicate Step Action
 *
 * Action for duplicating a workout step and inserting it after the original.
 */

import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import { isWorkoutStep } from "../../types/krd";
import { createdItemTarget } from "../focus-rules";
import { defaultIdProvider } from "../providers/id-provider";
import type { ItemId } from "../providers/item-id";
import type { WorkoutState } from "../workout-actions";
import { createUpdateWorkoutAction } from "../workout-actions";
import { buildKrdWithWorkout, extractStructuredWorkout } from "./_helpers";

export const duplicateStepAction = (
  krd: KRD,
  stepIndex: number,
  state: WorkoutState
): Partial<WorkoutState> => {
  const workout = extractStructuredWorkout(krd);
  if (!workout) return {};

  // Find the step to duplicate
  const stepToDuplicate = workout.steps.find(
    (step: WorkoutStep | RepetitionBlock) => {
      if (isWorkoutStep(step)) {
        return step.stepIndex === stepIndex;
      }
      return false;
    }
  ) as WorkoutStep | undefined;

  if (!stepToDuplicate) return {};

  // Create a deep clone of the step and assign a fresh ItemId so focus /
  // selection can reference the duplicate distinctly from the original.
  const duplicatedStep: WorkoutStep & { id: ItemId } = {
    ...(JSON.parse(JSON.stringify(stepToDuplicate)) as WorkoutStep),
    id: defaultIdProvider(),
  };

  // Insert the duplicated step after the original (at index + 1)
  const updatedSteps = [
    ...workout.steps.slice(0, stepIndex + 1),
    duplicatedStep,
    ...workout.steps.slice(stepIndex + 1),
  ];

  // Recalculate stepIndex for all steps
  const reindexedSteps = updatedSteps.map((step, index) => ({
    ...step,
    stepIndex: index,
  }));

  const updatedKrd: KRD = buildKrdWithWorkout(krd, {
    ...workout,
    steps: reindexedSteps,
  });

  return {
    ...createUpdateWorkoutAction(updatedKrd, state),
    pendingFocusTarget: createdItemTarget(duplicatedStep.id),
  };
};
