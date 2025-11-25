import type { StoreApi } from "zustand";
import { copyStepAction } from "./actions/copy-step-action";
import { pasteStepAction } from "./actions/paste-step-action";
import type { createWorkoutStoreActions } from "./workout-store-actions";
import type { WorkoutStore } from "./workout-store-types";

export const createBasicMethods = (
  actions: ReturnType<typeof createWorkoutStoreActions>,
  set: StoreApi<WorkoutStore>["setState"]
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
});

export const createClipboardMethods = (
  actions: ReturnType<typeof createWorkoutStoreActions>,
  set: StoreApi<WorkoutStore>["setState"],
  get: StoreApi<WorkoutStore>["getState"]
) => ({
  copyStep: async (stepIndex: number) => {
    const state = get();
    if (!state.currentWorkout) {
      return { success: false, message: "No workout loaded" };
    }
    return copyStepAction(state.currentWorkout, stepIndex);
  },
  pasteStep: async (insertIndex?: number) => {
    const state = get();
    if (!state.currentWorkout) {
      return { success: false, message: "No workout loaded" };
    }
    const result = await pasteStepAction(state.currentWorkout, insertIndex);
    if (result.success && result.updatedKrd) {
      set((state) => actions.updateWorkout(result.updatedKrd!, state));
    }
    return { success: result.success, message: result.message };
  },
});

export const createReorderMethods = (
  actions: ReturnType<typeof createWorkoutStoreActions>,
  set: StoreApi<WorkoutStore>["setState"],
  get: StoreApi<WorkoutStore>["getState"]
) => ({
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
});
