/**
 * Workout Store Types
 *
 * Type definitions for the workout store.
 */

import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";

export type WorkoutStore = {
  // State
  currentWorkout: KRD | null;
  workoutHistory: Array<KRD>;
  historyIndex: number;
  selectedStepId: string | null;
  isEditing: boolean;

  // Actions
  loadWorkout: (krd: KRD) => void;
  createEmptyWorkout: (name: string, sport: Sport) => void;
  updateWorkout: (krd: KRD) => void;
  createStep: () => void;
  deleteStep: (stepIndex: number) => void;
  duplicateStep: (stepIndex: number) => void;
  selectStep: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  clearWorkout: () => void;
  undo: () => void;
  redo: () => void;

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
};
