import { clearExpiredDeletesAction } from "./actions/clear-expired-deletes-action";
import { undoDeleteAction } from "./actions/undo-delete-action";
import { createAllBlockActions } from "./create-all-block-actions";
import { createAllStepActions } from "./create-all-step-actions";
import { createBaseWorkoutActions } from "./create-base-workout-actions";
import type { WorkoutState } from "./workout-actions";

const createStepActions = () => ({
  createStep: (state: WorkoutState) => createAllStepActions(state).createStep(),
  deleteStep: (stepIndex: number, state: WorkoutState) =>
    createAllStepActions(state).deleteStep(stepIndex),
  undoDelete: (timestamp: number, state: WorkoutState) => {
    const currentWorkout = state.currentWorkout;
    if (!currentWorkout) return {};
    return undoDeleteAction(currentWorkout, timestamp, state);
  },
  clearExpiredDeletes: (state: WorkoutState) =>
    clearExpiredDeletesAction(state),
  duplicateStep: (stepIndex: number, state: WorkoutState) =>
    createAllStepActions(state).duplicateStep(stepIndex),
  reorderStep: (activeIndex: number, overIndex: number, state: WorkoutState) =>
    createAllStepActions(state).reorderStep(activeIndex, overIndex),
  reorderStepsInBlock: (
    blockId: string,
    activeIndex: number,
    overIndex: number,
    state: WorkoutState
  ) =>
    createAllStepActions(state).reorderStepsInBlock(
      blockId,
      activeIndex,
      overIndex
    ),
});

const createBlockActions = () => ({
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
    blockId: string,
    repeatCount: number,
    state: WorkoutState
  ) => createAllBlockActions(state).editRepetitionBlock(blockId, repeatCount),
  addStepToRepetitionBlock: (blockId: string, state: WorkoutState) =>
    createAllBlockActions(state).addStepToRepetitionBlock(blockId),
  duplicateStepInRepetitionBlock: (
    blockId: string,
    stepIndex: number,
    state: WorkoutState
  ) =>
    createAllBlockActions(state).duplicateStepInRepetitionBlock(
      blockId,
      stepIndex
    ),
  ungroupRepetitionBlock: (blockId: string, state: WorkoutState) =>
    createAllBlockActions(state).ungroupRepetitionBlock(blockId),
  deleteRepetitionBlock: (blockId: string, state: WorkoutState) =>
    createAllBlockActions(state).deleteRepetitionBlock(blockId),
});

export function createWorkoutStoreActions() {
  const baseActions = createBaseWorkoutActions();
  return {
    ...baseActions,
    ...createStepActions(),
    ...createBlockActions(),
  };
}
