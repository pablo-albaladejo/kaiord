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
 * - Copy/Paste steps with Ctrl+C/V (with toast feedback)
 * - Create repetition block with Ctrl+G
 * - Ungroup repetition block with Ctrl+Shift+G
 * - Select all steps with Ctrl+A
 * - Clear selection with Escape
 */

import { useCallback, useMemo } from "react";

import { useCopyStep } from "../components/pages/WorkoutSection/useCopyStep";
import { usePasteStep } from "../components/pages/WorkoutSection/usePasteStep";
import { useKeyboardStoreSelectors } from "../store/selectors";
import type { Workout } from "../types/krd";
import { buildKeyboardHandlers } from "../utils/build-keyboard-handlers";
import { getSelectedStepIndex } from "../utils/get-selected-step-index";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

export const useAppKeyboardHandlers = () => {
  const store = useKeyboardStoreSelectors();
  const copyStep = useCopyStep();
  const pasteStep = usePasteStep();

  const workout = store.currentWorkout?.extensions?.structured_workout as
    Workout | undefined;

  const stepIndex = useCallback(
    () => getSelectedStepIndex(store.selectedStepId, workout),
    [store.selectedStepId, workout]
  );

  const handlers = useMemo(
    () =>
      buildKeyboardHandlers({
        ...store,
        workout,
        stepIndex,
        copyStep,
        pasteStep,
        deleteStep: store.deleteStep,
      }),
    [store, workout, stepIndex, copyStep, pasteStep]
  );

  useKeyboardShortcuts(handlers);
};
