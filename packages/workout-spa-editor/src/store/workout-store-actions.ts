import { clearExpiredDeletesAction } from "./actions/clear-expired-deletes-action";
import { deleteStepsAction } from "./actions/delete-steps-action";
import { undoDeleteAction } from "./actions/undo-delete-action";
import { createBaseWorkoutActions } from "./create-base-workout-actions";
import type { WorkoutState } from "./workout-actions";
import { createRepetitionBlockActions as blockActionsFor } from "./workout-store-repetition-actions";
import { createStepActions as stepActionsFor } from "./workout-store-step-actions";

const storeStepActions = () => ({
  createStep: (state: WorkoutState) => stepActionsFor(state).createStep(),
  deleteStep: (stepIndex: number, state: WorkoutState) =>
    stepActionsFor(state).deleteStep(stepIndex),
  deleteSteps: (stepIndices: ReadonlyArray<number>, state: WorkoutState) => {
    const currentWorkout = state.currentWorkout;
    if (!currentWorkout) return {};
    return deleteStepsAction(currentWorkout, stepIndices, state);
  },
  undoDelete: (groupId: string, state: WorkoutState) => {
    const currentWorkout = state.currentWorkout;
    if (!currentWorkout) return {};
    return undoDeleteAction(currentWorkout, groupId, state);
  },
  clearExpiredDeletes: (state: WorkoutState) =>
    clearExpiredDeletesAction(state),
  duplicateStep: (stepIndex: number, state: WorkoutState) =>
    stepActionsFor(state).duplicateStep(stepIndex),
  reorderStep: (activeIndex: number, overIndex: number, state: WorkoutState) =>
    stepActionsFor(state).reorderStep(activeIndex, overIndex),
  reorderStepsInBlock: (
    blockId: string,
    activeIndex: number,
    overIndex: number,
    state: WorkoutState
  ) =>
    stepActionsFor(state).reorderStepsInBlock(blockId, activeIndex, overIndex),
});

/** The two (blockId, stepIndex) block-step actions share one shape. */
const blockStepAction =
  (name: "duplicateStepInRepetitionBlock" | "deleteStepInRepetitionBlock") =>
  (blockId: string, stepIndex: number, state: WorkoutState) =>
    blockActionsFor(state)[name](blockId, stepIndex);

const storeBlockActions = () => ({
  createRepetitionBlock: (
    stepIndices: Array<number>,
    repeatCount: number,
    state: WorkoutState
  ) => blockActionsFor(state).createRepetitionBlock(stepIndices, repeatCount),
  createEmptyRepetitionBlock: (repeatCount: number, state: WorkoutState) =>
    blockActionsFor(state).createEmptyRepetitionBlock(repeatCount),
  editRepetitionBlock: (
    blockId: string,
    repeatCount: number,
    state: WorkoutState
  ) => blockActionsFor(state).editRepetitionBlock(blockId, repeatCount),
  addStepToRepetitionBlock: (blockId: string, state: WorkoutState) =>
    blockActionsFor(state).addStepToRepetitionBlock(blockId),
  duplicateStepInRepetitionBlock: blockStepAction(
    "duplicateStepInRepetitionBlock"
  ),
  deleteStepInRepetitionBlock: blockStepAction("deleteStepInRepetitionBlock"),
  ungroupRepetitionBlock: (blockId: string, state: WorkoutState) =>
    blockActionsFor(state).ungroupRepetitionBlock(blockId),
  deleteRepetitionBlock: (blockId: string, state: WorkoutState) =>
    blockActionsFor(state).deleteRepetitionBlock(blockId),
});

export function createWorkoutStoreActions() {
  return {
    ...createBaseWorkoutActions(),
    ...storeStepActions(),
    ...storeBlockActions(),
  };
}
