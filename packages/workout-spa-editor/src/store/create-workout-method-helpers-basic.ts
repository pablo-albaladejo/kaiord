import type { StoreApi } from "zustand";

import { copyStepAction } from "./actions/copy-step-action";
import { pasteStepAction } from "./actions/paste-step-action";
import { createdItemTarget } from "./focus-rules";
import type { ItemId } from "./providers/item-id";
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
      // `pasteStepAction` already regenerated the clipboard payload's ids
      // via `regeneratePasteIds`; `updateWorkout` now preserves those ids
      // (see `create-base-workout-actions`). Still clear the selection
      // after the mutation so no stale selectedStepIds point at items
      // that no longer exist (the selection before paste may have come
      // from a step that was reordered or whose id got regenerated in
      // a prior mutation).
      //
      // Focus lands on the freshly-pasted item — `pastedItemId` is the
      // regenerated UUID, never the clipboard-supplied id (paste-path
      // trust boundary, design decision 1).
      const pendingFocusTarget = result.pastedItemId
        ? createdItemTarget(result.pastedItemId as ItemId)
        : null;
      set((state) => ({
        ...actions.updateWorkout(result.updatedKrd!, state),
        selectedStepId: null,
        selectedStepIds: [],
        pendingFocusTarget,
      }));
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
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) =>
    set((state) =>
      actions.reorderStepsInBlock(blockId, activeIndex, overIndex, state)
    ),
});
