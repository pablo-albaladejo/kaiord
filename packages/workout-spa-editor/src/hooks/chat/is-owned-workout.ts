import type { PersistencePort } from "../../ports/persistence-port";

/**
 * Whether `workoutId` names a saved workout of `profileId`. An action whose
 * id the model chose checks this before acting: another profile's workout on
 * this device must read as `workout_not_found`, the same as a missing one, so
 * the result never reveals that it exists.
 */
export const isOwnedWorkout = async (
  persistence: PersistencePort,
  profileId: string,
  workoutId: string
): Promise<boolean> =>
  (await persistence.workouts.getById(workoutId))?.profileId === profileId;
