import { createWorkoutStoreBlockActions } from "./create-workout-store-block-actions";
import type { WorkoutState } from "./workout-actions";

export const createAllBlockActions = (state: WorkoutState) => {
  const blockActions = createWorkoutStoreBlockActions(state);
  return {
    createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
      blockActions.createRepetitionBlock(stepIndices, repeatCount),
    createEmptyRepetitionBlock: (repeatCount: number) =>
      blockActions.createEmptyRepetitionBlock(repeatCount),
    editRepetitionBlock: (blockId: string, repeatCount: number) =>
      blockActions.editRepetitionBlock(blockId, repeatCount),
    addStepToRepetitionBlock: (blockId: string) =>
      blockActions.addStepToRepetitionBlock(blockId),
    duplicateStepInRepetitionBlock: (blockId: string, stepIndex: number) =>
      blockActions.duplicateStepInRepetitionBlock(blockId, stepIndex),
    ungroupRepetitionBlock: (blockId: string) =>
      blockActions.ungroupRepetitionBlock(blockId),
    deleteRepetitionBlock: (blockId: string) =>
      blockActions.deleteRepetitionBlock(blockId),
  };
};
