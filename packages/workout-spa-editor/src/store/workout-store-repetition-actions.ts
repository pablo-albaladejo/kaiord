import { addStepToRepetitionBlockAction } from "./actions/add-step-to-repetition-block-action";
import { createEmptyRepetitionBlockAction } from "./actions/create-empty-repetition-block-action";
import { createRepetitionBlockAction } from "./actions/create-repetition-block-action";
import { duplicateStepInRepetitionBlockAction } from "./actions/duplicate-step-in-repetition-block-action";
import { editRepetitionBlockAction } from "./actions/edit-repetition-block-action";
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
    };
  }

  const krd = currentWorkout;

  return {
    createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
      createRepetitionBlockAction(krd, stepIndices, repeatCount, state),
    createEmptyRepetitionBlock: (repeatCount: number) =>
      createEmptyRepetitionBlockAction(krd, repeatCount, state),
    editRepetitionBlock: (blockIndex: number, repeatCount: number) =>
      editRepetitionBlockAction(krd, blockIndex, repeatCount, state),
    addStepToRepetitionBlock: (blockIndex: number) =>
      addStepToRepetitionBlockAction(krd, blockIndex, state),
    duplicateStepInRepetitionBlock: (blockIndex: number, stepIndex: number) =>
      duplicateStepInRepetitionBlockAction(krd, blockIndex, stepIndex, state),
  };
}
