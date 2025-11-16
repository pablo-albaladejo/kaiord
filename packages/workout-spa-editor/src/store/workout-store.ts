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
import type { KRD } from "../types/krd";
import {
  createClearWorkoutAction,
  createLoadWorkoutAction,
  createRedoAction,
  createStepAction,
  createUndoAction,
  createUpdateWorkoutAction,
} from "./workout-actions";

// ============================================
// Store State Types
// ============================================

export type WorkoutStore = {
  // State
  currentWorkout: KRD | null;
  workoutHistory: Array<KRD>;
  historyIndex: number;
  selectedStepId: string | null;
  isEditing: boolean;

  // Actions
  loadWorkout: (krd: KRD) => void;
  updateWorkout: (krd: KRD) => void;
  createStep: () => void;
  selectStep: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  clearWorkout: () => void;
  undo: () => void;
  redo: () => void;

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
};

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

  updateWorkout: (krd: KRD) =>
    set((state) => createUpdateWorkoutAction(krd, state)),

  createStep: () =>
    set((state) => {
      if (!state.currentWorkout) return {};
      return createStepAction(state.currentWorkout, state);
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
