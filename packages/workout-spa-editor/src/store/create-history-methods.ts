import {
  createClearWorkoutAction,
  createRedoAction,
  createUndoAction,
} from "./workout-actions";
import type { WorkoutStore } from "./workout-store-types";
import type { StoreApi } from "zustand";

export const createHistoryMethods = (
  set: StoreApi<WorkoutStore>["setState"],
  get: StoreApi<WorkoutStore>["getState"]
) => ({
  clearWorkout: () => set(createClearWorkoutAction()),
  undo: () => set((state) => createUndoAction(state)),
  redo: () => set((state) => createRedoAction(state)),
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().workoutHistory.length - 1,
});
