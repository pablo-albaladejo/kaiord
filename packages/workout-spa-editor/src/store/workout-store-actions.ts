import type { KRD, Sport } from "../types/krd";
// prettier-ignore
import { createEmptyWorkoutAction, createLoadWorkoutAction, createUpdateWorkoutAction } from "./workout-actions";
import type { WorkoutState } from "./workout-actions";
import { createRepetitionBlockActions } from "./workout-store-repetition-actions";
import { createStepActions } from "./workout-store-step-actions";

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
    createStep: (state: WorkoutState) => createStepActions(state).createStep(),
    deleteStep: (stepIndex: number, state: WorkoutState) =>
      createStepActions(state).deleteStep(stepIndex),
    duplicateStep: (stepIndex: number, state: WorkoutState) =>
      createStepActions(state).duplicateStep(stepIndex),
    createRepetitionBlock: (
      stepIndices: Array<number>,
      repeatCount: number,
      state: WorkoutState
    ) =>
      createRepetitionBlockActions(state).createRepetitionBlock(
        stepIndices,
        repeatCount
      ),
    createEmptyRepetitionBlock: (repeatCount: number, state: WorkoutState) =>
      createRepetitionBlockActions(state).createEmptyRepetitionBlock(
        repeatCount
      ),
    editRepetitionBlock: (
      blockIndex: number,
      repeatCount: number,
      state: WorkoutState
    ) =>
      createRepetitionBlockActions(state).editRepetitionBlock(
        blockIndex,
        repeatCount
      ),
    addStepToRepetitionBlock: (blockIndex: number, state: WorkoutState) =>
      createRepetitionBlockActions(state).addStepToRepetitionBlock(blockIndex),
    duplicateStepInRepetitionBlock: (
      blockIndex: number,
      stepIndex: number,
      state: WorkoutState
    ) =>
      createRepetitionBlockActions(state).duplicateStepInRepetitionBlock(
        blockIndex,
        stepIndex
      ),
  };
}
