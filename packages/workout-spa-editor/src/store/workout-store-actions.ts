import { createAllBlockActions } from "./create-all-block-actions";
import { createAllStepActions } from "./create-all-step-actions";
import { createBaseWorkoutActions } from "./create-base-workout-actions";
import type { WorkoutState } from "./workout-actions";

export function createWorkoutStoreActions() {
  const baseActions = createBaseWorkoutActions();
  return {
    ...baseActions,
    createStep: (state: WorkoutState) =>
      createAllStepActions(state).createStep(),
    deleteStep: (stepIndex: number, state: WorkoutState) =>
      createAllStepActions(state).deleteStep(stepIndex),
    duplicateStep: (stepIndex: number, state: WorkoutState) =>
      createAllStepActions(state).duplicateStep(stepIndex),
    reorderStep: (
      activeIndex: number,
      overIndex: number,
      state: WorkoutState
    ) => createAllStepActions(state).reorderStep(activeIndex, overIndex),
    reorderStepsInBlock: (
      blockIndex: number,
      activeIndex: number,
      overIndex: number,
      state: WorkoutState
    ) =>
      createAllStepActions(state).reorderStepsInBlock(
        blockIndex,
        activeIndex,
        overIndex
      ),
    createRepetitionBlock: (
      stepIndices: Array<number>,
      repeatCount: number,
      state: WorkoutState
    ) =>
      createAllBlockActions(state).createRepetitionBlock(
        stepIndices,
        repeatCount
      ),
    createEmptyRepetitionBlock: (repeatCount: number, state: WorkoutState) =>
      createAllBlockActions(state).createEmptyRepetitionBlock(repeatCount),
    editRepetitionBlock: (
      blockIndex: number,
      repeatCount: number,
      state: WorkoutState
    ) =>
      createAllBlockActions(state).editRepetitionBlock(blockIndex, repeatCount),
    addStepToRepetitionBlock: (blockIndex: number, state: WorkoutState) =>
      createAllBlockActions(state).addStepToRepetitionBlock(blockIndex),
    duplicateStepInRepetitionBlock: (
      blockIndex: number,
      stepIndex: number,
      state: WorkoutState
    ) =>
      createAllBlockActions(state).duplicateStepInRepetitionBlock(
        blockIndex,
        stepIndex
      ),
  };
}
