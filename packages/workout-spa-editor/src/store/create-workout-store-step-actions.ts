import { createStepActionHandlers } from "./create-step-action-handlers";
import type { WorkoutState } from "./workout-actions";

export const createWorkoutStoreStepActions = (state: WorkoutState) => {
  const handlers = createStepActionHandlers(state);
  return {
    createStep: () => handlers.createStep(),
    deleteStep: (stepIndex: number) => handlers.deleteStep(stepIndex),
    duplicateStep: (stepIndex: number) => handlers.duplicateStep(stepIndex),
    reorderStep: (activeIndex: number, overIndex: number) =>
      handlers.reorderStep(activeIndex, overIndex),
    reorderStepsInBlock: (
      blockIndex: number,
      activeIndex: number,
      overIndex: number
    ) => handlers.reorderStepsInBlock(blockIndex, activeIndex, overIndex),
  };
};
