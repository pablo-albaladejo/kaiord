import type { WorkoutState } from "./workout-actions";
import { createRepetitionBlockActions } from "./workout-store-repetition-actions";

export const createBlockActionHandlers = (state: WorkoutState) => {
  const blockActions = createRepetitionBlockActions(state);
  return {
    createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
      blockActions.createRepetitionBlock(stepIndices, repeatCount),
    createEmptyRepetitionBlock: (repeatCount: number) =>
      blockActions.createEmptyRepetitionBlock(repeatCount),
    editRepetitionBlock: (blockIndex: number, repeatCount: number) =>
      blockActions.editRepetitionBlock(blockIndex, repeatCount),
    addStepToRepetitionBlock: (blockIndex: number) =>
      blockActions.addStepToRepetitionBlock(blockIndex),
    duplicateStepInRepetitionBlock: (blockIndex: number, stepIndex: number) =>
      blockActions.duplicateStepInRepetitionBlock(blockIndex, stepIndex),
  };
};
