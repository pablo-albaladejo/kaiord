/**
 * Action signatures of the workout store.
 *
 * Split out of `workout-store-types.ts` so the types file stays under
 * the ≤80-line-per-file rule.
 */

import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { UIWorkout } from "../types/krd-ui";
import type { FocusTarget } from "./focus/focus-target.types";
import type { ModalConfig } from "./workout-store-state.types";

export type WorkoutStoreActions = {
  loadWorkout: (krd: KRD) => void;
  createEmptyWorkout: (name: string, sport: Sport) => void;
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

  // Focus slice actions (§4)
  setPendingFocusTarget: (target: FocusTarget | null) => void;

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;
  hasBackup: () => boolean;
};
