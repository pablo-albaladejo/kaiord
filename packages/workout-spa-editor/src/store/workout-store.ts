/**
 * Workout Store
 *
 * Zustand store for managing workout state with undo/redo functionality.
 *
 * Requirements:
 * - Requirement 15: Undo/redo functionality for workout editing
 * - Requirement 16: Track workout editing state
 */

import { create } from "zustand";
import { createStepAction } from "./actions/create-step-action";
import { deleteStepAction } from "./actions/delete-step-action";
import { duplicateStepAction } from "./actions/duplicate-step-action";
import {
  createClearWorkoutAction,
  createEmptyWorkoutAction,
  createLoadWorkoutAction,
  createRedoAction,
  createUndoAction,
  createUpdateWorkoutAction,
} from "./workout-actions";
import type { WorkoutStore } from "./workout-store-types";

export type { WorkoutStore } from "./workout-store-types";

// ============================================
// Store Implementation
// ============================================

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // Initial state
  currentWorkout: null,
  workoutHistory: [],
  historyIndex: -1,
  selectedStepId: null,
  isEditing: false,

  // Actions
  loadWorkout: (krd: KRD) => set(createLoadWorkoutAction(krd)),

  createEmptyWorkout: (name: string, sport: Sport) =>
    set(createEmptyWorkoutAction(name, sport)),

  updateWorkout: (krd: KRD) =>
    set((state) => createUpdateWorkoutAction(krd, state)),

  createStep: () =>
    set((state) => {
      if (!state.currentWorkout) return {};
      return createStepAction(state.currentWorkout, state);
    }),

  deleteStep: (stepIndex: number) =>
    set((state) => {
      if (!state.currentWorkout) return {};
      return deleteStepAction(state.currentWorkout, stepIndex, state);
    }),

  duplicateStep: (stepIndex: number) =>
    set((state) => {
      if (!state.currentWorkout) return {};
      return duplicateStepAction(state.currentWorkout, stepIndex, state);
    }),

  selectStep: (id: string | null) => set({ selectedStepId: id }),

  setEditing: (editing: boolean) => set({ isEditing: editing }),

  clearWorkout: () => set(createClearWorkoutAction()),

  undo: () => set((state) => createUndoAction(state)),

  redo: () => set((state) => createRedoAction(state)),

  // Computed
  canUndo: () => get().historyIndex > 0,

  canRedo: () => get().historyIndex < get().workoutHistory.length - 1,
}));
