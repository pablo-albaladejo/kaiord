/**
 * App Keyboard Handlers Hook
 *
 * Wires keyboard shortcuts to workout store actions.
 * Handles save, undo, redo, step reordering, copy/paste with toasts,
 * create/ungroup blocks, select all, and clear selection.
 *
 * Requirements:
 * - Requirement 15: Undo/Redo with keyboard shortcuts
 * - Requirement 29: Reorder steps with Alt+Up/Down
 * - Requirement 39.2: Copy/Paste steps with Ctrl+C/V (with toast feedback)
 * - Requirement 7.6.1: Create repetition block with Ctrl+G
 * - Requirement 7.6.2: Ungroup repetition block with Ctrl+Shift+G
 * - Requirement 7.6.3: Select all steps with Ctrl+A
 * - Requirement 7.6.4: Clear selection with Escape
 */

import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useCopyStep } from "../components/pages/WorkoutSection/useCopyStep";
import { usePasteStep } from "../components/pages/WorkoutSection/usePasteStep";
import { useWorkoutStore } from "../store/workout-store";
import {
  useCurrentWorkout,
  useSelectedStepId,
  useSelectedStepIds,
} from "../store/workout-store-selectors";
import { buildKeyboardHandlers } from "../utils/build-keyboard-handlers";
import { getSelectedStepIndex } from "../utils/get-selected-step-index";
import type { Workout } from "../types/krd";

export const useAppKeyboardHandlers = () => {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const selectedStepIds = useSelectedStepIds();
  const undo = useWorkoutStore((state) => state.undo);
  const redo = useWorkoutStore((state) => state.redo);
  const reorderStep = useWorkoutStore((state) => state.reorderStep);
  const canUndo = useWorkoutStore((state) => state.canUndo());
  const canRedo = useWorkoutStore((state) => state.canRedo());
  const openCreateBlockDialog = useWorkoutStore(
    (state) => state.openCreateBlockDialog
  );
  const ungroupRepetitionBlock = useWorkoutStore(
    (state) => state.ungroupRepetitionBlock
  );
  const selectAllSteps = useWorkoutStore((state) => state.selectAllSteps);
  const selectStep = useWorkoutStore((state) => state.selectStep);
  const clearStepSelection = useWorkoutStore(
    (state) => state.clearStepSelection
  );

  const copyStep = useCopyStep();
  const pasteStep = usePasteStep();

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  const stepIndex = () => getSelectedStepIndex(selectedStepId, workout);

  useKeyboardShortcuts(
    buildKeyboardHandlers({
      currentWorkout,
      workout,
      stepIndex,
      canUndo,
      canRedo,
      undo,
      redo,
      reorderStep,
      copyStep,
      pasteStep,
      selectedStepId,
      selectedStepIds,
      openCreateBlockDialog,
      ungroupRepetitionBlock,
      selectAllSteps,
      selectStep,
      clearStepSelection,
    })
  );
};
