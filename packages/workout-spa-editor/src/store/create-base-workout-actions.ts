import {
  createEmptyWorkoutAction,
  createLoadWorkoutAction,
  createUpdateWorkoutAction,
} from "./workout-actions";
import type { WorkoutState } from "./workout-actions";
import type { KRD, Sport } from "../types/krd";

export const createBaseWorkoutActions = () => ({
  loadWorkout: (krd: KRD) => createLoadWorkoutAction(krd),
  createEmptyWorkout: (name: string, sport: Sport) =>
    createEmptyWorkoutAction(name, sport),
  updateWorkout: (krd: KRD, state: WorkoutState) =>
    createUpdateWorkoutAction(krd, state),
});
