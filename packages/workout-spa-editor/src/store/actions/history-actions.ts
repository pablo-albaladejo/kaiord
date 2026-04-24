/**
 * History Actions
 *
 * Action creators for undo/redo functionality.
 */

import type { Workout } from "../../types/krd";
import { preservedSelectionTarget } from "../focus-rules";
import type { WorkoutState } from "../workout-actions";

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
  const entry = state.undoHistory[newIndex];
  const workout = entry?.workout?.extensions?.structured_workout as
    | Workout
    | undefined;
  const priorSelection = entry?.selection ?? null;
  const fallbackIndex = currentSelectionMainListIndex(state);
  return preservedSelectionTarget(workout, priorSelection, fallbackIndex);
};

export const createUndoAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  if (state.historyIndex > 0) {
    const newIndex = state.historyIndex - 1;
    return {
      currentWorkout: state.undoHistory[newIndex].workout,
      historyIndex: newIndex,
      pendingFocusTarget: focusForHistoryIndex(state, newIndex),
    };
  }
  return {};
};

export const createRedoAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  if (state.historyIndex < state.undoHistory.length - 1) {
    const newIndex = state.historyIndex + 1;
    return {
      currentWorkout: state.undoHistory[newIndex].workout,
      historyIndex: newIndex,
      pendingFocusTarget: focusForHistoryIndex(state, newIndex),
    };
  }
  return {};
};
