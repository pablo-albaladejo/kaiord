import { garminDateDrift } from "../../../application/garmin-placement/garmin-date-drift";
import { readSessionMovability } from "../../../application/read-session-movability";
import { GARMIN_BRIDGE_ID, ledgerRepo } from "../../../hooks/garmin-push-fn";
import type { PersistencePort } from "../../../ports/persistence-port";
import type { WorkoutRecord } from "../../../types/calendar-record";

/**
 * The workout as stored now, when Update Garmin should still move it: the
 * row exists, can move, and Garmin still holds it on another day.
 * Otherwise `undefined`.
 */
export const readPushableWorkout = async (
  persistence: PersistencePort,
  workoutId: string
): Promise<WorkoutRecord | undefined> => {
  const workout = await persistence.workouts.getById(workoutId);
  if (!workout) return undefined;
  const { movable } = await readSessionMovability(
    persistence,
    workout.profileId,
    workout
  );
  if (!movable) return undefined;
  const row = await ledgerRepo.findByNaturalKey({
    kaiordRecordId: workoutId,
    destinationBridgeId: GARMIN_BRIDGE_ID,
  });
  return garminDateDrift(row, workout, { locked: false }) ? workout : undefined;
};
