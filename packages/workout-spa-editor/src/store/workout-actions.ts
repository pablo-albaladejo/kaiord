import type { KRD, Workout } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { UIWorkout } from "../types/krd-ui";
import { migrateRepetitionBlocks } from "../utils/workout-migration";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import type { WorkoutState } from "./workout-state.types";

export type { WorkoutState };

const MAX_HISTORY_SIZE = 50;

export const createLoadWorkoutAction = (krd: KRD): Partial<WorkoutState> => {
  const workout = krd.extensions?.structured_workout as Workout | undefined;
  const migratedKrd = workout
    ? {
        ...krd,
        extensions: {
          ...krd.extensions,
          structured_workout: migrateRepetitionBlocks(workout),
        },
      }
    : krd;
  const uiWorkout = hydrateUIWorkout(migratedKrd);
  return {
    currentWorkout: uiWorkout,
    workoutHistory: [uiWorkout],
    historyIndex: 0,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  };
};

export const createUpdateWorkoutAction = (
  uiWorkout: UIWorkout,
  state: WorkoutState
): Partial<WorkoutState> => {
  const newHistory = [
    ...state.workoutHistory.slice(0, state.historyIndex + 1),
    uiWorkout,
  ];
  const trimmedHistory =
    newHistory.length > MAX_HISTORY_SIZE
      ? newHistory.slice(newHistory.length - MAX_HISTORY_SIZE)
      : newHistory;
  return {
    currentWorkout: uiWorkout,
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
  const emptyWorkout: UIWorkout = {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: new Date().toISOString(), sport },
    extensions: { structured_workout: { name, sport, steps: [] } },
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
