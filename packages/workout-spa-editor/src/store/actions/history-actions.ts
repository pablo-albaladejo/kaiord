/**
 * History Actions
 *
 * Action creators for undo/redo functionality.
 */

import type { Workout } from "../../types/krd";
import { preservedSelectionTarget } from "../focus-rules";
import type { ItemId } from "../providers/item-id";
import type { WorkoutState } from "../workout-actions";

/**
 * Compute the focus target for an undo/redo traversal.
 *
 * Reads the `selectionHistory` entry aligned with the new `historyIndex`
 * and delegates to `preservedSelectionTarget`, which falls back to the
 * same-index item or empty-state when the prior selection is gone.
 */
const focusForHistoryIndex = (
  state: WorkoutState,
  newIndex: number
): ReturnType<typeof preservedSelectionTarget> => {
  const snapshot = state.workoutHistory[newIndex];
  const workout = snapshot?.extensions?.structured_workout as
    | Workout
    | undefined;
  // `selectionHistory` is guaranteed parallel to `workoutHistory` by
  // `pushHistorySnapshot`, but legacy test fixtures may omit it
  // entirely. Fall back to `null` for a missing slot.
  const priorSelection =
    (state.selectionHistory?.[newIndex] as ItemId | null | undefined) ?? null;
  // Fallback index: try the prior selection's index in the destination
  // snapshot. Starting at 0 is the simplest safe choice — the rule
  // walks the list to find something focusable anyway.
  return preservedSelectionTarget(workout, priorSelection, 0);
};

export const createUndoAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  if (state.historyIndex > 0) {
    const newIndex = state.historyIndex - 1;
    return {
      currentWorkout: state.workoutHistory[newIndex],
      historyIndex: newIndex,
      pendingFocusTarget: focusForHistoryIndex(state, newIndex),
    };
  }
  return {};
};

export const createRedoAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  if (state.historyIndex < state.workoutHistory.length - 1) {
    const newIndex = state.historyIndex + 1;
    return {
      currentWorkout: state.workoutHistory[newIndex],
      historyIndex: newIndex,
      pendingFocusTarget: focusForHistoryIndex(state, newIndex),
    };
  }
  return {};
};
