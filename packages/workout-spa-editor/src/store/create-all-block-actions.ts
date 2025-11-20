import { createWorkoutStoreBlockActions } from "./create-workout-store-block-actions";
import type { WorkoutState } from "./workout-actions";

export const createAllBlockActions = (state: WorkoutState) => {
  const blockActions = createWorkoutStoreBlockActions(state);
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
