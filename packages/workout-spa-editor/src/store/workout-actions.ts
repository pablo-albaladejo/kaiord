import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { UIWorkout } from "../types/krd-ui";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import { asItemId } from "./providers/item-id";
import type { WorkoutState } from "./workout-state.types";
import { pushHistorySnapshot } from "./workout-store-history";

export type { WorkoutState };

export const createLoadWorkoutAction = (krd: KRD): Partial<WorkoutState> => {
  const uiWorkout = hydrateUIWorkout(krd);
  return {
    currentWorkout: uiWorkout,
    undoHistory: [{ workout: uiWorkout, selection: null }],
    historyIndex: 0,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  };
};

export const createUpdateWorkoutAction = (
  uiWorkout: UIWorkout,
  state: WorkoutState
): Partial<WorkoutState> =>
  pushHistorySnapshot(
    { undoHistory: state.undoHistory, historyIndex: state.historyIndex },
    {
      workout: uiWorkout,
      selection: state.selectedStepId ? asItemId(state.selectedStepId) : null,
    }
  );

export const createClearWorkoutAction = (): Partial<WorkoutState> => ({
  currentWorkout: null,
  undoHistory: [],
  historyIndex: -1,
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
    undoHistory: [{ workout: emptyWorkout, selection: null }],
    historyIndex: 0,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  };
};

export { createRedoAction, createUndoAction } from "./actions/history-actions";
