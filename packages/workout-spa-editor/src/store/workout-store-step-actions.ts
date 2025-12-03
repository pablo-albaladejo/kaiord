import { createStepAction } from "./actions/create-step-action";
import { deleteStepAction } from "./actions/delete-step-action";
import { duplicateStepAction } from "./actions/duplicate-step-action";
import { reorderStepAction } from "./actions/reorder-step-action";
import { reorderStepsInBlockAction } from "./actions/reorder-steps-in-block-action";
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
      reorderStep: () => ({}),
      reorderStepsInBlock: () => ({}),
    };
  }

  return {
    createStep: () => createStepAction(currentWorkout, state),
    deleteStep: (stepIndex: number) =>
      deleteStepAction(currentWorkout, stepIndex, state),
    duplicateStep: (stepIndex: number) =>
      duplicateStepAction(currentWorkout, stepIndex, state),
    reorderStep: (activeIndex: number, overIndex: number) =>
      reorderStepAction(currentWorkout, activeIndex, overIndex, state),
    reorderStepsInBlock: (
      blockId: string,
      activeIndex: number,
      overIndex: number
    ) =>
      reorderStepsInBlockAction(
        currentWorkout,
        blockId,
        activeIndex,
        overIndex,
        state
      ),
  };
}
