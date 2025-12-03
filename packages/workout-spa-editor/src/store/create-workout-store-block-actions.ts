import { createBlockActionHandlers } from "./create-block-action-handlers";
import type { WorkoutState } from "./workout-actions";

export const createWorkoutStoreBlockActions = (state: WorkoutState) => {
  const handlers = createBlockActionHandlers(state);
  return {
    createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
      handlers.createRepetitionBlock(stepIndices, repeatCount),
    createEmptyRepetitionBlock: (repeatCount: number) =>
      handlers.createEmptyRepetitionBlock(repeatCount),
    editRepetitionBlock: (blockId: string, repeatCount: number) =>
      handlers.editRepetitionBlock(blockId, repeatCount),
    addStepToRepetitionBlock: (blockId: string) =>
      handlers.addStepToRepetitionBlock(blockId),
    duplicateStepInRepetitionBlock: (blockId: string, stepIndex: number) =>
      handlers.duplicateStepInRepetitionBlock(blockId, stepIndex),
    ungroupRepetitionBlock: (blockId: string) =>
      handlers.ungroupRepetitionBlock(blockId),
    deleteRepetitionBlock: (blockId: string) =>
      handlers.deleteRepetitionBlock(blockId),
  };
};
