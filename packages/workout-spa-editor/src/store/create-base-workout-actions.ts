import type { KRD, Sport } from "../types/krd";
import type { UIWorkout } from "../types/krd-ui";
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
  // Mid-session mutation: every caller builds from `currentWorkout` which
  // is already a UIWorkout with ids assigned. Preserve them here so
  // `updateWorkout` does not silently overwrite the stable ItemIds the
  // focus / selection subsystem depends on. Fresh regeneration is the
  // job of `loadWorkout` on a new session.
  updateWorkout: (workout: UIWorkout, state: WorkoutState) =>
    createUpdateWorkoutAction(
      hydrateUIWorkout(workout, { preserveExistingIds: true }),
      state
    ),
});
