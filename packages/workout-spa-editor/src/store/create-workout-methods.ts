import type { StoreApi } from "zustand";
import type { createWorkoutStoreActions } from "./workout-store-actions";
import type { WorkoutStore } from "./workout-store-types";

export const createWorkoutMethods = (
  actions: ReturnType<typeof createWorkoutStoreActions>,
  set: StoreApi<WorkoutStore>["setState"],
  get: StoreApi<WorkoutStore>["getState"]
) => ({
  loadWorkout: (krd: Parameters<WorkoutStore["loadWorkout"]>[0]) =>
    set(actions.loadWorkout(krd)),
  createEmptyWorkout: (
    name: Parameters<WorkoutStore["createEmptyWorkout"]>[0],
    sport: Parameters<WorkoutStore["createEmptyWorkout"]>[1]
  ) => set(actions.createEmptyWorkout(name, sport)),
  updateWorkout: (krd: Parameters<WorkoutStore["updateWorkout"]>[0]) =>
    set((state) => actions.updateWorkout(krd, state)),
  createStep: () => set((state) => actions.createStep(state)),
  deleteStep: (stepIndex: number) =>
    set((state) => actions.deleteStep(stepIndex, state)),
  undoDelete: (timestamp: number) =>
    set((state) => actions.undoDelete(timestamp, state)),
  clearExpiredDeletes: () => set((state) => actions.clearExpiredDeletes(state)),
  duplicateStep: (stepIndex: number) =>
    set((state) => actions.duplicateStep(stepIndex, state)),
  reorderStep: (activeIndex: number, overIndex: number) => {
    const result = actions.reorderStep(activeIndex, overIndex, get());
    set(result);
  },
  reorderStepsInBlock: (
    blockIndex: number,
    activeIndex: number,
    overIndex: number
  ) =>
    set((state) =>
      actions.reorderStepsInBlock(blockIndex, activeIndex, overIndex, state)
    ),
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
});
