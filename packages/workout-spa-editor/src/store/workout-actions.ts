import { migrateRepetitionBlocks } from "../utils/workout-migration";
import type { WorkoutState } from "./workout-state.types";
import type { KRD, Workout } from "../types/krd";
import type { Sport } from "../types/krd-core";

export type { WorkoutState };

const MAX_HISTORY_SIZE = 50;

export const createLoadWorkoutAction = (krd: KRD): Partial<WorkoutState> => {
  const workout = krd.extensions?.workout as Workout | undefined;
  const migratedKrd = workout
    ? {
        ...krd,
        extensions: {
          ...krd.extensions,
          workout: migrateRepetitionBlocks(workout),
        },
      }
    : krd;
  return {
    currentWorkout: migratedKrd,
    workoutHistory: [migratedKrd],
    historyIndex: 0,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  };
};

export const createUpdateWorkoutAction = (
  krd: KRD,
  state: WorkoutState
): Partial<WorkoutState> => {
  const newHistory = [
    ...state.workoutHistory.slice(0, state.historyIndex + 1),
    krd,
  ];
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
  selectedStepIds: [],
  isEditing: false,
});

export const createEmptyWorkoutAction = (
  name: string,
  sport: Sport
): Partial<WorkoutState> => {
  const emptyWorkout: KRD = {
    version: "1.0",
    type: "workout",
    metadata: { created: new Date().toISOString(), sport },
    extensions: { workout: { name, sport, steps: [] } },
  };
  return {
    currentWorkout: emptyWorkout,
    workoutHistory: [emptyWorkout],
    historyIndex: 0,
    selectedStepId: null,
    isEditing: false,
  };
};

export { createRedoAction, createUndoAction } from "./actions/history-actions";
