/**
 * Workout Store Types
 *
 * Type definitions for the workout store.
 */

import type { KRD, RepetitionBlock, WorkoutStep } from "../types/krd";
import type { Sport } from "../types/krd-core";

export type DeletedStep = {
  step: WorkoutStep | RepetitionBlock;
  index: number;
  timestamp: number;
};

export type ModalConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant: "default" | "destructive";
};

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
  deletedSteps: Array<DeletedStep>;
  isModalOpen: boolean;
  modalConfig: ModalConfig | null;
  createBlockDialogOpen: boolean;

  // Actions
  loadWorkout: (krd: KRD) => void;
  createEmptyWorkout: (name: string, sport: Sport) => void;
  updateWorkout: (krd: KRD) => void;
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
