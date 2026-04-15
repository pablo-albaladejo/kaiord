import type { KRD, Workout } from "../types/krd";

export type KeyboardHandlerDeps = {
  currentWorkout: KRD | null;
  workout: Workout | undefined;
  stepIndex: () => number | null;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reorderStep: (from: number, to: number) => void;
  copyStep: (stepIndex: number) => Promise<void>;
  pasteStep: (position: number) => Promise<void>;
  deleteStep: (stepIndex: number) => void;
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  openCreateBlockDialog: () => void;
  ungroupRepetitionBlock: (blockId: string) => void;
  selectAllSteps: (ids: Array<string>) => void;
  selectStep: (id: string | null) => void;
  clearStepSelection: () => void;
};
