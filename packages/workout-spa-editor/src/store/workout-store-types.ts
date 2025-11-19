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
  selectedStepIds: Array<string>;
  isEditing: boolean;
  safeMode: boolean;
  lastBackup: KRD | null;

  // Actions
  loadWorkout: (krd: KRD) => void;
  createEmptyWorkout: (name: string, sport: Sport) => void;
  updateWorkout: (krd: KRD) => void;
  createStep: () => void;
  deleteStep: (stepIndex: number) => void;
  duplicateStep: (stepIndex: number) => void;
  createRepetitionBlock: (
    stepIndices: Array<number>,
    repeatCount: number
  ) => void;
  editRepetitionBlock: (blockIndex: number, repeatCount: number) => void;
  addStepToRepetitionBlock: (blockIndex: number) => void;
  selectStep: (id: string | null) => void;
  toggleStepSelection: (id: string) => void;
  clearStepSelection: () => void;
  setEditing: (editing: boolean) => void;
  clearWorkout: () => void;
  undo: () => void;
  redo: () => void;

  // Error Recovery Actions
  createBackup: () => void;
  restoreFromBackup: () => boolean;
  enableSafeMode: () => void;
  disableSafeMode: () => void;

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
  hasBackup: () => boolean;
};
