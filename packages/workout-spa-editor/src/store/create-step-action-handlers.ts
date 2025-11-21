import type { WorkoutState } from "./workout-actions";
import { createStepActions } from "./workout-store-step-actions";

export const createStepActionHandlers = (state: WorkoutState) => {
  const stepActions = createStepActions(state);
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
