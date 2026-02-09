/**
 * Build Keyboard Handlers
 *
 * Creates the keyboard shortcut handler configuration for the app.
 * Pure function that maps store actions to keyboard shortcut callbacks.
 */

import { saveWorkout } from "./save-workout";
import type { KRD, Workout } from "../types/krd";

type KeyboardHandlerDeps = {
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
  selectedStepId: string | null;
  selectedStepIds: Array<string>;
  openCreateBlockDialog: () => void;
  ungroupRepetitionBlock: (blockId: string) => void;
  selectAllSteps: (ids: Array<string>) => void;
  selectStep: (id: string | null) => void;
  clearStepSelection: () => void;
};

export const buildKeyboardHandlers = (deps: KeyboardHandlerDeps) => ({
  onSave: () => {
    if (deps.currentWorkout) saveWorkout(deps.currentWorkout);
  },
  onUndo: () => {
    if (deps.canUndo) deps.undo();
  },
  onRedo: () => {
    if (deps.canRedo) deps.redo();
  },
  onMoveStepUp: () => {
    const idx = deps.stepIndex();
    if (idx !== null && idx > 0) deps.reorderStep(idx, idx - 1);
  },
  onMoveStepDown: () => {
    const idx = deps.stepIndex();
    if (idx !== null && deps.workout && idx < deps.workout.steps.length - 1) {
      deps.reorderStep(idx, idx + 1);
    }
  },
  onCopy: () => {
    const idx = deps.stepIndex();
    if (idx !== null && deps.workout) {
      const step = deps.workout.steps[idx];
      if (step && "stepIndex" in step) void deps.copyStep(step.stepIndex);
    }
  },
  onPaste: () => {
    const idx = deps.stepIndex();
    if (idx !== null) {
      void deps.pasteStep(idx + 1);
    } else if (deps.workout) {
      void deps.pasteStep(deps.workout.steps.length);
    }
  },
  onCreateBlock: () => {
    if (deps.selectedStepIds.length >= 2) {
      deps.openCreateBlockDialog();
    }
  },
  onUngroupBlock: () => {
    if (!deps.selectedStepId) return;
    if (deps.selectedStepId.startsWith("block-")) {
      deps.ungroupRepetitionBlock(deps.selectedStepId);
    }
  },
  onSelectAll: () => {
    if (!deps.workout) return;
    const ids = deps.workout.steps
      .filter((step) => "stepIndex" in step)
      .map((step) => `step-${(step as { stepIndex: number }).stepIndex}`);
    deps.selectAllSteps(ids);
  },
  onClearSelection: () => {
    deps.clearStepSelection();
    deps.selectStep(null);
  },
});
