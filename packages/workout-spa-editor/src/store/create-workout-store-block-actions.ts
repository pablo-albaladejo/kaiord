import { createBlockActionHandlers } from "./create-block-action-handlers";
import type { WorkoutState } from "./workout-actions";

export const createWorkoutStoreBlockActions = (state: WorkoutState) => {
  const handlers = createBlockActionHandlers(state);
  return {
    createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
      handlers.createRepetitionBlock(stepIndices, repeatCount),
    createEmptyRepetitionBlock: (repeatCount: number) =>
      handlers.createEmptyRepetitionBlock(repeatCount),
    editRepetitionBlock: (blockIndex: number, repeatCount: number) =>
      handlers.editRepetitionBlock(blockIndex, repeatCount),
    addStepToRepetitionBlock: (blockIndex: number) =>
      handlers.addStepToRepetitionBlock(blockIndex),
    duplicateStepInRepetitionBlock: (blockIndex: number, stepIndex: number) =>
      handlers.duplicateStepInRepetitionBlock(blockIndex, stepIndex),
    ungroupRepetitionBlock: (blockIndex: number) =>
      handlers.ungroupRepetitionBlock(blockIndex),
  };
};
