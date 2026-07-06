/**
 * Pushes a persisted workout to Garmin through the injected bridge push
 * function. Governed by `executeWorkoutPush`: no active, enabled export
 * route to Garmin ⇒ a clear `no_active_export_route` tool error instead
 * of silently attempting the push. Returns a tool-result payload; a
 * bridge-reported failure is carried as `push_failed`, so this never
 * throws for it. On success the record is re-persisted with the push id
 * so the calendar lifecycle badge reflects the push.
 */
import { db } from "../../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../../adapters/dexie/dexie-export-ledger-repository";
import { createDexieIntegrationPolicyRepository } from "../../adapters/dexie/dexie-integration-policy-repository";
import {
  executeWorkoutPush,
  NoActiveExportRouteError,
} from "../../application/export/execute-workout-push";
import { recordGarminPush } from "../../application/record-garmin-push";
import type { GarminPushOutcome } from "../../contexts/garmin-bridge-types";
import type { PersistencePort } from "../../ports/persistence-port";
import { exportGcnWorkout } from "../../utils/export-workout-formats";

const policyRepo = createDexieIntegrationPolicyRepository(db);
const ledgerRepo = createDexieExportLedgerRepository(db);
const GARMIN_BRIDGE_ID = "garmin-bridge";

/** Marks a bridge-reported push failure (never rejects on its own, so
    this is the adapter's way of telling executeWorkoutPush to abort the
    ledger commit and roll back the pending row). */
class BridgePushFailedError extends Error {}

export const doPushToGarmin = async (
  persistence: PersistencePort,
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>,
  workoutId: string
): Promise<unknown> => {
  const record = await persistence.workouts.getById(workoutId);
  if (!record?.krd) return { error: "workout_not_found" };
  const gcn = await exportGcnWorkout(record.krd);

  let garminPushId: string;
  try {
    const result = await executeWorkoutPush(
      { policyRepo, ledgerRepo },
      {
        profileId: record.profileId,
        kaiordRecordId: record.id,
        destinationBridgeId: GARMIN_BRIDGE_ID,
        payload: gcn as Record<string, unknown>,
        pushFn: async (payload) => {
          const outcome = await pushWorkout(payload);
          if (!outcome.success) throw new BridgePushFailedError();
          return {
            externalId: outcome.garminWorkoutId ?? `garmin-${Date.now()}`,
          };
        },
      }
    );
    if (!result.externalId) return { error: "push_failed" };
    garminPushId = result.externalId;
  } catch (error) {
    if (error instanceof NoActiveExportRouteError) {
      return { error: "no_active_export_route", message: error.message };
    }
    return { error: "push_failed" };
  }

  // Re-read before persisting so edits made while the push was in flight
  // are not overwritten by the stale copy captured above.
  const fresh = await persistence.workouts.getById(workoutId);
  await persistence.workouts.put(
    recordGarminPush(fresh ?? record, garminPushId)
  );
  return { workoutId: record.id, garminPushId };
};
