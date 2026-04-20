/**
 * History Actions
 *
 * Action creators for undo/redo functionality.
 */

import { preservedSelectionTarget } from "../focus-rules";
import { asItemId } from "../providers/item-id";
import type { WorkoutState } from "../workout-actions";

const asId = (s: string | null) => (s ? asItemId(s) : null);

export const createUndoAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  if (state.historyIndex <= 0) return {};
  const newIndex = state.historyIndex - 1;
  const restored = state.workoutHistory[newIndex];
  // On undo, the focus target is the selection captured for the snapshot
  // we are undoing (i.e. the selection the user had right before the
  // mutation that we are rolling back).
  const prevSelection =
    state.selectionHistory?.[state.historyIndex] ?? asId(state.selectedStepId);
  return {
    currentWorkout: restored,
    historyIndex: newIndex,
    pendingFocusTarget: preservedSelectionTarget(restored, prevSelection, 0),
  };
};

export const createRedoAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  if (state.historyIndex >= state.workoutHistory.length - 1) return {};
  const newIndex = state.historyIndex + 1;
  const restored = state.workoutHistory[newIndex];
  const selection = asId(state.selectedStepId);
  return {
    currentWorkout: restored,
    historyIndex: newIndex,
    pendingFocusTarget: preservedSelectionTarget(restored, selection, 0),
  };
};
