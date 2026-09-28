/**
 * Pushes a persisted workout to Garmin through the injected bridge push
 * function. Governed by `executeWorkoutPush`: no active, enabled export
 * route to Garmin ⇒ a clear `no_active_export_route` tool error instead
 * of silently attempting the push. Returns a tool-result payload; a
 * bridge-reported failure is carried as `push_failed`, and a push of the
 * same workout already in flight (the ledger's `lost-race`) as
 * `push_in_progress`, so this never throws for either. When Garmin confirmed the library workout id, the record is
 * re-persisted with that id so the calendar lifecycle badge reflects the
 * push; an unconfirmed push (no Garmin-shaped id) or a lost race persists
 * nothing, so neither a sentinel nor `"pending"` ever becomes a push id.
 */
import {
  executeWorkoutPush,
  NoActiveExportRouteError,
} from "../../application/export/execute-workout-push";
import { recordGarminPush } from "../../application/record-garmin-push";
import type { GarminPushOutcome } from "../../contexts/garmin-bridge-types";
import type { PersistencePort } from "../../ports/persistence-port";
import { exportGcnWorkout } from "../../utils/export-workout-formats";
import {
  buildGarminPushFn,
  GARMIN_BRIDGE_ID,
  ledgerRepo,
  policyRepo,
} from "../garmin-push-fn";

export const doPushToGarmin = async (
  persistence: PersistencePort,
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>,
  workoutId: string
): Promise<unknown> => {
  const record = await persistence.workouts.getById(workoutId);
  if (!record?.krd) return { error: "workout_not_found" };
  const gcn = await exportGcnWorkout(record.krd);

  let garminPushId: string | null;
  try {
    const result = await executeWorkoutPush(
      { policyRepo, ledgerRepo },
      {
        profileId: record.profileId,
        kaiordRecordId: record.id,
        destinationBridgeId: GARMIN_BRIDGE_ID,
        payload: gcn as Record<string, unknown>,
        pushFn: buildGarminPushFn(pushWorkout),
      }
    );
    if (result.outcome === "lost-race") return { error: "push_in_progress" };
    garminPushId =
      result.library?.kind === "confirmed" ? result.library.workoutId : null;
  } catch (error) {
    if (error instanceof NoActiveExportRouteError) {
      return { error: "no_active_export_route", message: error.message };
    }
    return { error: "push_failed" };
  }

  if (garminPushId === null) return { workoutId: record.id, garminPushId };
  // Re-read before persisting so edits made while the push was in flight
  // are not overwritten by the stale copy captured above.
  const fresh = await persistence.workouts.getById(workoutId);
  await persistence.workouts.put(
    recordGarminPush(fresh ?? record, garminPushId)
  );
  return { workoutId: record.id, garminPushId };
};
