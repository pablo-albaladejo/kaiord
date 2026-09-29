/**
 * Pushes a persisted workout to Garmin and places it on its date in the
 * Garmin calendar (`pushWorkoutToGarminCalendar`). Governed like every
 * export: no active, enabled export route to Garmin ⇒ a clear
 * `no_active_export_route` tool error. A library push that lost to a run
 * already in flight is `push_in_progress`, and one the bridge failed is
 * `push_failed`, so this never throws for either.
 *
 * Otherwise the result carries `calendar`: the placement's kind, an
 * app-authored enum. When Garmin confirmed the library workout id, the
 * record is re-persisted with that id so the calendar lifecycle badge
 * reflects the push; an unconfirmed push persists nothing, so neither a
 * sentinel nor `"pending"` ever becomes a push id.
 */
import { NoActiveExportRouteError } from "../../application/export/execute-workout-push";
import type { PlacementResult } from "../../application/garmin-placement/placement-result";
import {
  type PlacementPipelineDeps,
  pushWorkoutToGarminCalendar,
} from "../../application/garmin-placement/push-workout-to-garmin-calendar";
import { recordGarminPush } from "../../application/record-garmin-push";
import type { GarminPushOutcome } from "../../contexts/garmin-bridge-types";
import type { PersistencePort } from "../../ports/persistence-port";
import { exportGcnWorkout } from "../../utils/export-workout-formats";
import { garminPlacementRequest } from "../garmin-placement-request";
import { GARMIN_BRIDGE_ID } from "../garmin-push-fn";

/** The Phase 1 failures, as the tool's error codes. */
const libraryError = (result: PlacementResult) => {
  if (result.kind !== "failed") return undefined;
  if (result.reason === "no-export-route") {
    const { message } = new NoActiveExportRouteError(GARMIN_BRIDGE_ID);
    return { error: "no_active_export_route", message };
  }
  if (result.reason === "busy") return { error: "push_in_progress" };
  if (result.reason === "library-push-failed") return { error: "push_failed" };
  return undefined;
};

export const doPushToGarmin = async (
  persistence: PersistencePort,
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>,
  workoutId: string,
  placementDeps: PlacementPipelineDeps
): Promise<unknown> => {
  const record = await persistence.workouts.getById(workoutId);
  if (!record?.krd) return { error: "workout_not_found" };
  const gcn = await exportGcnWorkout(record.krd);

  const confirmed: { id?: string } = {};
  const result = await pushWorkoutToGarminCalendar(
    placementDeps,
    garminPlacementRequest(
      { record, gcn, ledgerRepo: placementDeps.ledgerRepo, pushWorkout },
      { onLibraryConfirmed: (id) => (confirmed.id = id) }
    )
  );
  const garminPushId = confirmed.id ?? null;
  const error = garminPushId === null ? libraryError(result) : undefined;
  if (error) return error;
  const done = { workoutId: record.id, garminPushId, calendar: result.kind };
  if (garminPushId === null) return done;
  // Re-read before persisting so edits made while the push was in flight
  // are not overwritten by the stale copy captured above.
  const fresh = await persistence.workouts.getById(workoutId);
  await persistence.workouts.put(
    recordGarminPush(fresh ?? record, garminPushId)
  );
  return done;
};
