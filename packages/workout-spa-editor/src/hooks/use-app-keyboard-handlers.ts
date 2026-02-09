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

import { useCallback, useMemo } from "react";
import { useKeyboardStoreSelectors } from "./use-keyboard-store-selectors";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { useCopyStep } from "../components/pages/WorkoutSection/useCopyStep";
import { usePasteStep } from "../components/pages/WorkoutSection/usePasteStep";
import { buildKeyboardHandlers } from "../utils/build-keyboard-handlers";
import { getSelectedStepIndex } from "../utils/get-selected-step-index";
import type { Workout } from "../types/krd";

export const useAppKeyboardHandlers = () => {
  const store = useKeyboardStoreSelectors();
  const copyStep = useCopyStep();
  const pasteStep = usePasteStep();

  const workout = store.currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

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
      }),
    [store, workout, stepIndex, copyStep, pasteStep]
  );

  useKeyboardShortcuts(handlers);
};
