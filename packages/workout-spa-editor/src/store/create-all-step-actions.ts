import { createWorkoutStoreStepActions } from "./create-workout-store-step-actions";
import type { WorkoutState } from "./workout-actions";

export const createAllStepActions = (state: WorkoutState) => {
  const stepActions = createWorkoutStoreStepActions(state);
  return {
    createStep: () => stepActions.createStep(),
    deleteStep: (stepIndex: number) => stepActions.deleteStep(stepIndex),
    duplicateStep: (stepIndex: number) => stepActions.duplicateStep(stepIndex),
    reorderStep: (activeIndex: number, overIndex: number) =>
      stepActions.reorderStep(activeIndex, overIndex),
    reorderStepsInBlock: (
      blockIndex: number,
      activeIndex: number,
      overIndex: number
    ) => stepActions.reorderStepsInBlock(blockIndex, activeIndex, overIndex),
  };
};
