/**
<<<<<<< HEAD
 * Workout Store
 *
 * Zustand store for managing workout state with undo/redo functionality.
 *
 * Requirements:
 * - Requirement 15: Undo/redo functionality for workout editing
 * - Requirement 16: Track workout editing state
=======
 * Workout Store - Zustand store for workout state management
 *
 * This store manages the current workout, selection state, and editing mode.
 * It provides actions for loading, updating, and selecting workout steps.
 *
 * Requirements:
 * - Requirement 1: Display workout structure (loadWorkout)
 * - Requirement 2: Create new workouts (updateWorkout)
 * - Requirement 3: Edit existing steps (selectStep, isEditing)
 * - Requirement 15: Undo/redo functionality (undo, redo, workoutHistory)
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
 */

import { create } from "zustand";
import type { KRD } from "../types/krd";
<<<<<<< HEAD
import { createStepAction } from "./actions/create-step-action";
import { deleteStepAction } from "./actions/delete-step-action";
import { duplicateStepAction } from "./actions/duplicate-step-action";
import {
  createClearWorkoutAction,
  createLoadWorkoutAction,
  createRedoAction,
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
=======

// ============================================
// Constants
// ============================================

const MAX_HISTORY_SIZE = 50;

// ============================================
// Store State Interface
// ============================================

export type WorkoutStore = {
  // Workout state
  currentWorkout: KRD | null;

  // History state (Requirement 15)
  workoutHistory: Array<KRD>;
  historyIndex: number;

  // UI state
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
  selectedStepId: string | null;
  isEditing: boolean;

  // Actions
  loadWorkout: (krd: KRD) => void;
  updateWorkout: (krd: KRD) => void;
<<<<<<< HEAD
  createStep: () => void;
  deleteStep: (stepIndex: number) => void;
  duplicateStep: (stepIndex: number) => void;
  selectStep: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  clearWorkout: () => void;
  undo: () => void;
  redo: () => void;

  // Computed
=======
  selectStep: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  clearWorkout: () => void;

  // History actions (Requirement 15)
  undo: () => void;
  redo: () => void;
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
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

<<<<<<< HEAD
  // Actions
  loadWorkout: (krd: KRD) => set(createLoadWorkoutAction(krd)),

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
=======
  // Load a workout into the store
  // Used when opening a KRD file or creating a new workout
  loadWorkout: (krd: KRD) => {
    set({
      currentWorkout: krd,
      workoutHistory: [krd],
      historyIndex: 0,
      selectedStepId: null,
      isEditing: false,
    });
  },

  // Update the current workout
  // Used when modifying workout metadata or steps
  // Adds the new state to history and clears redo history
  updateWorkout: (krd: KRD) => {
    set((state) => {
      // Get history up to current index (discard redo history)
      const newHistory = state.workoutHistory.slice(0, state.historyIndex + 1);

      // Add new state to history
      newHistory.push(krd);

      // Limit history size to MAX_HISTORY_SIZE
      const trimmedHistory =
        newHistory.length > MAX_HISTORY_SIZE
          ? newHistory.slice(newHistory.length - MAX_HISTORY_SIZE)
          : newHistory;

      return {
        currentWorkout: krd,
        workoutHistory: trimmedHistory,
        historyIndex: trimmedHistory.length - 1,
      };
    });
  },

  // Select a workout step for viewing or editing
  // Pass null to deselect
  selectStep: (id: string | null) => {
    set({ selectedStepId: id });
  },

  // Set editing mode
  // Used to toggle between view and edit modes
  setEditing: (editing: boolean) => {
    set({ isEditing: editing });
  },

  // Clear the current workout
  // Used when closing a workout or starting fresh
  clearWorkout: () => {
    set({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  },

  // Undo the last change (Requirement 15)
  // Moves back in history if possible
  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          currentWorkout: state.workoutHistory[newIndex],
          historyIndex: newIndex,
        };
      }
      return state;
    });
  },

  // Redo the last undone change (Requirement 15)
  // Moves forward in history if possible
  redo: () => {
    set((state) => {
      if (state.historyIndex < state.workoutHistory.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          currentWorkout: state.workoutHistory[newIndex],
          historyIndex: newIndex,
        };
      }
      return state;
    });
  },

  // Check if undo is available
  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  // Check if redo is available
  canRedo: () => {
    const state = get();
    return state.historyIndex < state.workoutHistory.length - 1;
  },
}));

// Selector hooks exported from workout-store-selectors.ts
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
