/**
 * Shared push-function wiring for executeWorkoutPush's Garmin destination.
 * Both useGarminPush (editor/detail/coaching-dialog) and doPushToGarmin
 * (chat tool) push through the same governed path; this owns the Dexie
 * repo singletons and the bridge-failure marker so neither redeclares them.
 */
import { db } from "../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../adapters/dexie/dexie-export-ledger-repository";
import type { ExecuteWorkoutPushInput } from "../application/export/execute-workout-push";
import type { GarminPushOutcome } from "../contexts/garmin-bridge-types";

export { policyRepo } from "./integration-policy-repo";
export const ledgerRepo = createDexieExportLedgerRepository(db);
export const GARMIN_BRIDGE_ID = "garmin-bridge";

const UNCONFIRMED_EXTERNAL_ID = "garmin-unconfirmed";

/** The bridge echoes this id back from Garmin's response, and it travels on:
    it is persisted as `garminPushId` and returned to the model by the
    `push_to_garmin` chat tool. Nothing upstream constrains it, so anything
    that is not id-shaped is treated as no id at all rather than forwarded. */
const ID_SHAPE = /^[A-Za-z0-9_-]{1,64}$/;

const asExternalId = (id: string | null | undefined): string =>
  id && ID_SHAPE.test(id) ? id : UNCONFIRMED_EXTERNAL_ID;

/** Marks a bridge-reported push failure (never rejects on its own): the
    caller's `pushWorkout` resolves `{ success: false }` and records its own
    error state, so the outer catch must not overwrite it with a generic
    message — throwing this marker lets it recognize and skip that. */
export class BridgePushFailedError extends Error {}

/** Wraps a bridge's `pushWorkout` into `executeWorkoutPush`'s `pushFn`
    contract. Falls back to a stable sentinel id when the bridge doesn't
    echo one back — or echoes one that is not id-shaped — so neither a
    missing id nor a malformed one breaks idempotent re-push keying. */
export const buildGarminPushFn = (
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>
): ExecuteWorkoutPushInput["pushFn"] => {
  return async (payload) => {
    const outcome = await pushWorkout(payload);
    if (!outcome.success) throw new BridgePushFailedError();
    return { externalId: asExternalId(outcome.garminWorkoutId) };
  };
};
