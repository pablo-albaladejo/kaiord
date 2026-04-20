import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { ModalConfig } from "./workout-store-state.types";

export type WorkoutStoreActions = {
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

  createBackup: () => void;
  restoreFromBackup: () => boolean;
  enableSafeMode: () => void;
  disableSafeMode: () => void;

  showConfirmationModal: (config: ModalConfig) => void;
  hideConfirmationModal: () => void;
  openCreateBlockDialog: () => void;
  closeCreateBlockDialog: () => void;

  canUndo: () => boolean;
  canRedo: () => boolean;
  hasBackup: () => boolean;
};
