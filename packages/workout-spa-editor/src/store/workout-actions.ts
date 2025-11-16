/**
 * Workout Store Actions
 *
 * Action creators for workout store operations.
 */

import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";

const MAX_HISTORY_SIZE = 50;

export type WorkoutState = {
  currentWorkout: KRD | null;
  workoutHistory: Array<KRD>;
  historyIndex: number;
  selectedStepId: string | null;
  isEditing: boolean;
};

export const createLoadWorkoutAction = (krd: KRD): Partial<WorkoutState> => ({
  currentWorkout: krd,
  workoutHistory: [krd],
  historyIndex: 0,
  selectedStepId: null,
  isEditing: false,
});

export const createUpdateWorkoutAction = (
  krd: KRD,
  state: WorkoutState
): Partial<WorkoutState> => {
  const newHistory = state.workoutHistory.slice(0, state.historyIndex + 1);
  newHistory.push(krd);

  const trimmedHistory =
    newHistory.length > MAX_HISTORY_SIZE
      ? newHistory.slice(newHistory.length - MAX_HISTORY_SIZE)
      : newHistory;

  return {
    currentWorkout: krd,
    workoutHistory: trimmedHistory,
    historyIndex: trimmedHistory.length - 1,
  };
};

export const createClearWorkoutAction = (): Partial<WorkoutState> => ({
  currentWorkout: null,
  workoutHistory: [],
  historyIndex: -1,
  selectedStepId: null,
  isEditing: false,
});

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

export const createEmptyWorkoutAction = (
  name: string,
  sport: Sport
): Partial<WorkoutState> => {
  const emptyWorkout: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: new Date().toISOString(),
      sport,
    },
    extensions: {
      workout: {
        name,
        sport,
        steps: [],
      },
    },
  };

  return {
    currentWorkout: emptyWorkout,
    workoutHistory: [emptyWorkout],
    historyIndex: 0,
    selectedStepId: null,
    isEditing: false,
  };
};
