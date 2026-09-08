/**
 * Shared push-function wiring for executeWorkoutPush's TrainingPeaks
 * destination — the counterpart of `garmin-push-fn.ts`.
 *
 * `executeWorkoutPush` is already destination-agnostic (it takes
 * `destinationBridgeId` and a `pushFn`), so TrainingPeaks needs only this
 * adapter from the bridge transport to that contract, plus the same Dexie
 * repo singletons the Garmin path uses.
 */
import { db } from "../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../adapters/dexie/dexie-export-ledger-repository";
import { pushTrainingPeaksWorkout } from "../adapters/trainingpeaks/trainingpeaks-workout-transport";
import type { ExecuteWorkoutPushInput } from "../application/export/execute-workout-push";
import { TRAININGPEAKS_BRIDGE_ID } from "../application/trainingpeaks/trainingpeaks-weight-import";

export { policyRepo } from "./integration-policy-repo";
export const ledgerRepo = createDexieExportLedgerRepository(db);
export { TRAININGPEAKS_BRIDGE_ID };

/**
 * Wraps the bridge transport into `executeWorkoutPush`'s `pushFn` contract.
 *
 * Unlike Garmin, TrainingPeaks always echoes the created workout's id, so
 * there is no unconfirmed-id sentinel to fall back on: a response without an
 * id is a transport error and the transport has already thrown by here.
 */
export const buildTrainingPeaksPushFn = (
  extensionId: string
): ExecuteWorkoutPushInput["pushFn"] => {
  return async (payload) => {
    const workoutId = await pushTrainingPeaksWorkout(extensionId, payload);
    return { externalId: String(workoutId) };
  };
};
