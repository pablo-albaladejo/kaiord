import type { KRD } from "../types/krd";
import type { Sport } from "../types/krd-core";
import type { UIWorkout } from "../types/krd-ui";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import type { WorkoutState } from "./workout-state.types";
import { pushHistorySnapshot } from "./workout-store-history";

export type { WorkoutState };

export const createLoadWorkoutAction = (krd: KRD): Partial<WorkoutState> => {
  // `hydrateUIWorkout` now assigns fresh UUID v4 ids to every step and
  // block; the legacy `migrateRepetitionBlocks` pre-pass that seeded the
  // `block-{timestamp}-{random}` format is no longer needed.
  const uiWorkout = hydrateUIWorkout(krd);
  // Fresh session: a single snapshot, no prior selection. `selectionHistory`
  // is kept parallel to `workoutHistory` so undo/redo never drift.
  return {
    currentWorkout: uiWorkout,
    workoutHistory: [uiWorkout],
    historyIndex: 0,
    selectedStepId: null,
    selectedStepIds: [],
    selectionHistory: [null],
    isEditing: false,
  };
};

export const createUpdateWorkoutAction = (
  uiWorkout: UIWorkout,
  state: WorkoutState
): Partial<WorkoutState> => {
  // Route every mid-session push through the helper so the
  // `selectionHistory` array stays parallel to `workoutHistory`. CI grep
  // enforces the single-call-site rule.
  return pushHistorySnapshot(
    {
      workoutHistory: state.workoutHistory,
      historyIndex: state.historyIndex,
      selectionHistory: state.selectionHistory,
    },
    uiWorkout,
    state.selectedStepId
  );
};

export const createClearWorkoutAction = (): Partial<WorkoutState> => ({
  currentWorkout: null,
  workoutHistory: [],
  historyIndex: -1,
  selectedStepId: null,
  selectedStepIds: [],
  selectionHistory: [],
  isEditing: false,
  // No workout means there is nothing to focus — explicit null so the
  // hook (§7) sees a fresh state rather than leftover intent from the
  // previous session.
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
    selectedStepId: null,
    selectedStepIds: [],
    selectionHistory: [null],
    isEditing: false,
  };
};

export { createRedoAction, createUndoAction } from "./actions/history-actions";
