import type { KRD, Workout } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { UIWorkout } from "../types/krd-ui";
import { migrateRepetitionBlocks } from "../utils/workout-migration";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import type { ItemId } from "./providers/item-id";
import { asItemId } from "./providers/item-id";
import type { WorkoutState } from "./workout-state.types";
import { pushHistorySnapshot } from "./workout-store-history";

export type { WorkoutState };

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
    selectionHistory: [null],
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    pendingFocusTarget: null,
  };
};

const selectionAsItemId = (state: WorkoutState): ItemId | null =>
  state.selectedStepId ? asItemId(state.selectedStepId) : null;

export const createUpdateWorkoutAction = (
  uiWorkout: UIWorkout,
  state: WorkoutState
): Partial<WorkoutState> => ({
  currentWorkout: uiWorkout,
  ...pushHistorySnapshot(uiWorkout, selectionAsItemId(state), state),
});

export const createClearWorkoutAction = (): Partial<WorkoutState> => ({
  currentWorkout: null,
  workoutHistory: [],
  historyIndex: -1,
  selectionHistory: [],
  selectedStepId: null,
  selectedStepIds: [],
  isEditing: false,
  pendingFocusTarget: null,
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
    selectionHistory: [null],
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
    pendingFocusTarget: null,
  };
};

export { createRedoAction, createUndoAction } from "./actions/history-actions";
