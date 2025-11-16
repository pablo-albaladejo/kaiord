/**
 * History Actions
 *
 * Action creators for undo/redo functionality.
 */

import type { WorkoutState } from "../workout-actions";

export const createUndoAction = (
  state: WorkoutState
): Partial<WorkoutState> => {
  if (state.historyIndex > 0) {
    const newIndex = state.historyIndex - 1;
    return {
      currentWorkout: state.workoutHistory[newIndex],
      historyIndex: newIndex,
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
    };
  }
  return {};
};
