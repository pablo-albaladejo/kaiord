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
 * and delegates to `preservedSelectionTarget`. When the prior selection
 * is gone from the destination snapshot, the rule uses the *current*
 * selection's position in the workout we're leaving as the fallback
 * index, so focus lands near the same logical position rather than
 * jumping to slot 0.
 */
const currentSelectionMainListIndex = (state: WorkoutState): number => {
  const currentWorkout = state.currentWorkout?.extensions
    ?.structured_workout as Workout | undefined;
  const steps = currentWorkout?.steps ?? [];
  const currentId = state.selectedStepId;
  if (!currentId) return 0;
  const idx = steps.findIndex(
    (item) => (item as { id?: string }).id === currentId
  );
  return idx >= 0 ? idx : 0;
};

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
  const fallbackIndex = currentSelectionMainListIndex(state);
  return preservedSelectionTarget(workout, priorSelection, fallbackIndex);
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
