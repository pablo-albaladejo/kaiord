import type { KRD, Sport } from "../types/krd";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import type { WorkoutState } from "./workout-actions";
import {
  createEmptyWorkoutAction,
  createLoadWorkoutAction,
  createUpdateWorkoutAction,
} from "./workout-actions";

export const createBaseWorkoutActions = () => ({
  loadWorkout: (krd: KRD) => createLoadWorkoutAction(krd),
  createEmptyWorkout: (name: string, sport: Sport) =>
    createEmptyWorkoutAction(name, sport),
  updateWorkout: (krd: KRD, state: WorkoutState) =>
    createUpdateWorkoutAction(hydrateUIWorkout(krd), state),
});
