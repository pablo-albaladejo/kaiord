import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { UIWorkout } from "../types/krd-ui";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import type { WorkoutState } from "./workout-state.types";

export type { WorkoutState };

const MAX_HISTORY_SIZE = 50;

export const createLoadWorkoutAction = (krd: KRD): Partial<WorkoutState> => {
  // `hydrateUIWorkout` now assigns fresh UUID v4 ids to every step and
  // block; the legacy `migrateRepetitionBlocks` pre-pass that seeded the
  // `block-{timestamp}-{random}` format is no longer needed.
  const uiWorkout = hydrateUIWorkout(krd);
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
    selectedStepIds: [],
    isEditing: false,
  };
};

export { createRedoAction, createUndoAction } from "./actions/history-actions";
