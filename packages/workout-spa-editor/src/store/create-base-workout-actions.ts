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
  // Mid-session mutation: the incoming krd is already a UIWorkout with
  // ids assigned (set by action creators or `regeneratePasteIds`).
  // Preserve them here so `updateWorkout` does not silently overwrite
  // the stable ItemIds the focus / selection subsystem depends on. Fresh
  // regeneration is the job of `loadWorkout` on a new session.
  updateWorkout: (krd: KRD, state: WorkoutState) =>
    createUpdateWorkoutAction(
      hydrateUIWorkout(krd, { preserveExistingIds: true }),
      state
    ),
});
