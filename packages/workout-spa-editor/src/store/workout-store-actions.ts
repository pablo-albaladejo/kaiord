import type { KRD, Sport } from "../types/krd";
import { addStepToRepetitionBlockAction } from "./actions/add-step-to-repetition-block-action";
import { createEmptyRepetitionBlockAction } from "./actions/create-empty-repetition-block-action";
import { createRepetitionBlockAction } from "./actions/create-repetition-block-action";
import { createStepAction } from "./actions/create-step-action";
import { deleteStepAction } from "./actions/delete-step-action";
import { duplicateStepAction } from "./actions/duplicate-step-action";
import { editRepetitionBlockAction } from "./actions/edit-repetition-block-action";
// prettier-ignore
import { createEmptyWorkoutAction, createLoadWorkoutAction, createUpdateWorkoutAction } from "./workout-actions";
import type { WorkoutState } from "./workout-actions";

/**
 * Creates action handlers for the workout store
 */
export function createWorkoutStoreActions() {
  return {
    loadWorkout: (krd: KRD) => createLoadWorkoutAction(krd),
    createEmptyWorkout: (name: string, sport: Sport) =>
      createEmptyWorkoutAction(name, sport),
    updateWorkout: (krd: KRD, state: WorkoutState) =>
      createUpdateWorkoutAction(krd, state),
    createStep: (state: WorkoutState) =>
      !state.currentWorkout
        ? {}
        : createStepAction(state.currentWorkout, state),
    deleteStep: (stepIndex: number, state: WorkoutState) =>
      !state.currentWorkout
        ? {}
        : deleteStepAction(state.currentWorkout, stepIndex, state),
    duplicateStep: (stepIndex: number, state: WorkoutState) =>
      !state.currentWorkout
        ? {}
        : duplicateStepAction(state.currentWorkout, stepIndex, state),
    createRepetitionBlock: (
      stepIndices: Array<number>,
      repeatCount: number,
      state: WorkoutState
    ) =>
      !state.currentWorkout
        ? {}
        : createRepetitionBlockAction(
            state.currentWorkout,
            stepIndices,
            repeatCount,
            state
          ),
    createEmptyRepetitionBlock: (repeatCount: number, state: WorkoutState) =>
      !state.currentWorkout
        ? {}
        : createEmptyRepetitionBlockAction(
            state.currentWorkout,
            repeatCount,
            state
          ),
    editRepetitionBlock: (
      blockIndex: number,
      repeatCount: number,
      state: WorkoutState
    ) =>
      !state.currentWorkout
        ? {}
        : editRepetitionBlockAction(
            state.currentWorkout,
            blockIndex,
            repeatCount,
            state
          ),
    addStepToRepetitionBlock: (blockIndex: number, state: WorkoutState) =>
      !state.currentWorkout
        ? {}
        : addStepToRepetitionBlockAction(
            state.currentWorkout,
            blockIndex,
            state
          ),
  };
}
