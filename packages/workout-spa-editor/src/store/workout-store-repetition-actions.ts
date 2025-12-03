import { addStepToRepetitionBlockAction } from "./actions/add-step-to-repetition-block-action";
import { createEmptyRepetitionBlockAction } from "./actions/create-empty-repetition-block-action";
import { createRepetitionBlockAction } from "./actions/create-repetition-block-action";
import { deleteRepetitionBlockAction } from "./actions/delete-repetition-block-action";
import { duplicateStepInRepetitionBlockAction } from "./actions/duplicate-step-in-repetition-block-action";
import { editRepetitionBlockAction } from "./actions/edit-repetition-block-action";
import { ungroupRepetitionBlockAction } from "./actions/ungroup-repetition-block-action";
import type { WorkoutState } from "./workout-actions";

/**
 * Creates repetition block-related action handlers
 */
export function createRepetitionBlockActions(state: WorkoutState) {
  const currentWorkout = state.currentWorkout;
  if (!currentWorkout) {
    return {
      createRepetitionBlock: () => ({}),
      createEmptyRepetitionBlock: () => ({}),
      editRepetitionBlock: () => ({}),
      addStepToRepetitionBlock: () => ({}),
      duplicateStepInRepetitionBlock: () => ({}),
      ungroupRepetitionBlock: () => ({}),
      deleteRepetitionBlock: () => ({}),
    };
  }

  const krd = currentWorkout;

  return {
    createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
      createRepetitionBlockAction(krd, stepIndices, repeatCount, state),
    createEmptyRepetitionBlock: (repeatCount: number) =>
      createEmptyRepetitionBlockAction(krd, repeatCount, state),
    editRepetitionBlock: (blockId: string, repeatCount: number) =>
      editRepetitionBlockAction(krd, blockId, repeatCount, state),
    addStepToRepetitionBlock: (blockId: string) =>
      addStepToRepetitionBlockAction(krd, blockId, state),
    duplicateStepInRepetitionBlock: (blockId: string, stepIndex: number) =>
      duplicateStepInRepetitionBlockAction(krd, blockId, stepIndex, state),
    ungroupRepetitionBlock: (blockId: string) =>
      ungroupRepetitionBlockAction(krd, blockId, state),
    deleteRepetitionBlock: (blockId: string) =>
      deleteRepetitionBlockAction(krd, blockId, state),
  };
}
