/**
 * Workout Store Types
 *
 * Type definitions for the workout store.
 */

import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { UIWorkout, UIWorkoutItem } from "../types/krd-ui";

export type DeletedStep = {
  step: UIWorkoutItem;
  index: number;
  timestamp: number;
};

export type ModalConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant: "default" | "destructive";
};

export type WorkoutStore = {
  // State
  currentWorkout: UIWorkout | null;
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  isEditing: boolean;
  safeMode: boolean;
  lastBackup: UIWorkout | null;
  deletedSteps: Array<DeletedStep>;
  isModalOpen: boolean;
  modalConfig: ModalConfig | null;
  createBlockDialogOpen: boolean;

  // Actions
  // `loadWorkout` accepts a portable KRD from any external source (file
  // import, Dexie, etc.) and hydrates it into a UIWorkout.
  loadWorkout: (krd: KRD) => void;
  createEmptyWorkout: (name: string, sport: Sport) => void;
  // `updateWorkout` is a mid-session mutation: every caller builds from
  // `currentWorkout` which is already a UIWorkout, so narrow the param
  // type to make the "ids must be present" contract explicit.
  updateWorkout: (workout: UIWorkout) => void;
  createStep: () => void;
  deleteStep: (stepIndex: number) => void;
  undoDelete: (timestamp: number) => void;
  clearExpiredDeletes: () => void;
  duplicateStep: (stepIndex: number) => void;
  copyStep: (
    stepIndex: number
  ) => Promise<{ success: boolean; message: string }>;
  pasteStep: (
    insertIndex?: number
  ) => Promise<{ success: boolean; message: string }>;
  reorderStep: (activeIndex: number, overIndex: number) => void;
  reorderStepsInBlock: (
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) => void;
  createRepetitionBlock: (
    stepIndices: Array<number>,
    repeatCount: number
  ) => void;
  createEmptyRepetitionBlock: (repeatCount: number) => void;
  editRepetitionBlock: (blockId: string, repeatCount: number) => void;
  addStepToRepetitionBlock: (blockId: string) => void;
  duplicateStepInRepetitionBlock: (blockId: string, stepIndex: number) => void;
  ungroupRepetitionBlock: (blockId: string) => void;
  deleteRepetitionBlock: (blockId: string) => void;
  selectStep: (id: string | null) => void;
  toggleStepSelection: (id: string) => void;
  clearStepSelection: () => void;
  selectAllSteps: (ids: Array<string>) => void;
  setEditing: (editing: boolean) => void;
  clearWorkout: () => void;
  undo: () => void;
  redo: () => void;

  // Error Recovery Actions
  createBackup: () => void;
  restoreFromBackup: () => boolean;
  enableSafeMode: () => void;
  disableSafeMode: () => void;

  // Modal Actions
  showConfirmationModal: (config: ModalConfig) => void;
  hideConfirmationModal: () => void;
  openCreateBlockDialog: () => void;
  closeCreateBlockDialog: () => void;

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
  hasBackup: () => boolean;
};
