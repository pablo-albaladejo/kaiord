import { createStepAction } from "./actions/create-step-action";
import { deleteStepAction } from "./actions/delete-step-action";
import { duplicateStepAction } from "./actions/duplicate-step-action";
import type { WorkoutState } from "./workout-actions";

/**
 * Creates step-related action handlers
 */
export function createStepActions(state: WorkoutState) {
  const currentWorkout = state.currentWorkout;
  if (!currentWorkout) {
    return {
      createStep: () => ({}),
      deleteStep: () => ({}),
      duplicateStep: () => ({}),
    };
  }

  return {
    createStep: () => createStepAction(currentWorkout, state),
    deleteStep: (stepIndex: number) =>
      deleteStepAction(currentWorkout, stepIndex, state),
    duplicateStep: (stepIndex: number) =>
      duplicateStepAction(currentWorkout, stepIndex, state),
  };
}
