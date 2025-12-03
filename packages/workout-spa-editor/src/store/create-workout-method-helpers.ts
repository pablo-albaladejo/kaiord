import type { StoreApi } from "zustand";
import {
  createBasicMethods,
  createClipboardMethods,
  createReorderMethods,
} from "./create-workout-method-helpers-basic";
import type { createWorkoutStoreActions } from "./workout-store-actions";
import type { WorkoutStore } from "./workout-store-types";

export const createBlockMethods = (
  actions: ReturnType<typeof createWorkoutStoreActions>,
  set: StoreApi<WorkoutStore>["setState"]
) => ({
  createRepetitionBlock: (stepIndices: Array<number>, repeatCount: number) =>
    set((state) =>
      actions.createRepetitionBlock(stepIndices, repeatCount, state)
    ),
  createEmptyRepetitionBlock: (repeatCount: number) =>
    set((state) => actions.createEmptyRepetitionBlock(repeatCount, state)),
  editRepetitionBlock: (blockId: string, repeatCount: number) =>
    set((state) => actions.editRepetitionBlock(blockId, repeatCount, state)),
  addStepToRepetitionBlock: (blockId: string) =>
    set((state) => actions.addStepToRepetitionBlock(blockId, state)),
  duplicateStepInRepetitionBlock: (blockId: string, stepIndex: number) =>
    set((state) =>
      actions.duplicateStepInRepetitionBlock(blockId, stepIndex, state)
    ),
  ungroupRepetitionBlock: (blockId: string) =>
    set((state) => actions.ungroupRepetitionBlock(blockId, state)),
  deleteRepetitionBlock: (blockId: string) =>
    set((state) => actions.deleteRepetitionBlock(blockId, state)),
});

export const createAllWorkoutMethods = (
  actions: ReturnType<typeof createWorkoutStoreActions>,
  set: StoreApi<WorkoutStore>["setState"],
  get: StoreApi<WorkoutStore>["getState"]
) => ({
  ...createBasicMethods(actions, set),
  ...createClipboardMethods(actions, set, get),
  ...createReorderMethods(actions, set, get),
  ...createBlockMethods(actions, set),
});
