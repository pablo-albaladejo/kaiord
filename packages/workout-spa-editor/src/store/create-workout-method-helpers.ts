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
  editRepetitionBlock: (blockIndex: number, repeatCount: number) =>
    set((state) => actions.editRepetitionBlock(blockIndex, repeatCount, state)),
  addStepToRepetitionBlock: (blockIndex: number) =>
    set((state) => actions.addStepToRepetitionBlock(blockIndex, state)),
  duplicateStepInRepetitionBlock: (blockIndex: number, stepIndex: number) =>
    set((state) =>
      actions.duplicateStepInRepetitionBlock(blockIndex, stepIndex, state)
    ),
  ungroupRepetitionBlock: (blockIndex: number) =>
    set((state) => actions.ungroupRepetitionBlock(blockIndex, state)),
  deleteRepetitionBlock: (blockIndex: number) =>
    set((state) => actions.deleteRepetitionBlock(blockIndex, state)),
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
