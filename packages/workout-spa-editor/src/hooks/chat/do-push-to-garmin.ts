/**
 * Pushes a persisted workout to Garmin through the injected bridge push
 * function. Returns a tool-result payload; a bridge-reported failure is
 * carried in the outcome, so this never throws for it. On success the
 * record is re-persisted with the push id so the calendar lifecycle badge
 * reflects the push.
 */
import { recordGarminPush } from "../../application/record-garmin-push";
import type { GarminPushOutcome } from "../../contexts/garmin-bridge-types";
import type { PersistencePort } from "../../ports/persistence-port";
import { exportGcnWorkout } from "../../utils/export-workout-formats";

export const doPushToGarmin = async (
  persistence: PersistencePort,
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>,
  workoutId: string
): Promise<unknown> => {
  const record = await persistence.workouts.getById(workoutId);
  if (!record?.krd) return { error: "workout_not_found" };
  const gcn = await exportGcnWorkout(record.krd);
  const outcome = await pushWorkout(gcn);
  if (!outcome.success) return { error: "push_failed" };
  const garminPushId = outcome.garminWorkoutId ?? `garmin-${Date.now()}`;
  await persistence.workouts.put(recordGarminPush(record, garminPushId));
  return { workoutId: record.id, garminPushId };
};
