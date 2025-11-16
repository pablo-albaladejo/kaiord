/**
 * Workout Store Actions
 *
 * Action creators for workout store operations.
 */

import type { KRD } from "../types/krd";

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

export const createStepAction = (
  krd: KRD,
  state: WorkoutState
): Partial<WorkoutState> => {
  if (!krd.extensions?.workout) {
    return {};
  }

  const workout = krd.extensions.workout;
  const newStepIndex = workout.steps.length;

  const newStep = {
    stepIndex: newStepIndex,
    durationType: "open" as const,
    duration: { type: "open" as const },
    targetType: "open" as const,
    target: { type: "open" as const },
  };

  const updatedWorkout = {
    ...workout,
    steps: [...workout.steps, newStep],
  };

  const updatedKrd: KRD = {
    ...krd,
    extensions: {
      ...krd.extensions,
      workout: updatedWorkout,
    },
  };

  return createUpdateWorkoutAction(updatedKrd, state);
};
