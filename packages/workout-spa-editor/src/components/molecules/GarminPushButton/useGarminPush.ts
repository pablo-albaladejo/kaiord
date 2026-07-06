import { useCallback } from "react";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../../../adapters/dexie/dexie-export-ledger-repository";
import { createDexieIntegrationPolicyRepository } from "../../../adapters/dexie/dexie-integration-policy-repository";
import { executeWorkoutPush } from "../../../application/export/execute-workout-push";
import { useAnalytics, useGarminBridge } from "../../../contexts";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

const policyRepo = createDexieIntegrationPolicyRepository(db);
const ledgerRepo = createDexieExportLedgerRepository(db);
const GARMIN_BRIDGE_ID = "garmin-bridge";

/** Marks that the bridge itself reported failure (runPush already set the
    specific `pushing` error message) — the outer catch must not
    overwrite it with a generic one. */
class BridgePushFailedError extends Error {}

/**
 * Pushes a persisted workout to Garmin Connect.
 *
 * The hook accepts the persisted Dexie `WorkoutRecord` directly; it does NOT
 * read from the editor's Zustand draft store. Callers MUST pass the
 * Dexie-backed record (read via `useLiveQuery`), not the in-memory editor
 * draft.
 *
 * This hook sends the workout and reports the outcome; it does NOT persist
 * the `pushed` state transition — that stays owned by `useEditorActions`
 * (spa-workout-state-machine), so a quick push from the detail footer or
 * the coaching dialog does not flip state out from under an open editor.
 *
 * The push is governed by `executeWorkoutPush`: no active, enabled export
 * route to Garmin ⇒ the push never reaches the bridge (fail-closed,
 * visible cause in `pushing.message`). On success it's recorded in the
 * export ledger (idempotent re-push).
 *
 * Callers:
 * - `GarminPushButton.tsx` — reads the workout via `useLiveQuery` and passes
 *   the record. The editor pushes the last-persisted state.
 * - `CoachingActivityDialog.tsx` — reads the workout via the same Dexie path
 *   and passes the record from the matched session.
 */
export const useGarminPush = (workout: WorkoutRecord | undefined) => {
  const { pushWorkout, setPushing, sessionActive } = useGarminBridge();
  const analytics = useAnalytics();

  const push = useCallback(async () => {
    if (!workout?.krd || !sessionActive) return;

    try {
      const gcn = await exportGcnWorkout(workout.krd);
      await executeWorkoutPush(
        { policyRepo, ledgerRepo },
        {
          profileId: workout.profileId,
          kaiordRecordId: workout.id,
          destinationBridgeId: GARMIN_BRIDGE_ID,
          payload: gcn as Record<string, unknown>,
          // pushWorkout never rejects on a bridge-reported failure — it
          // resolves { success: false } and sets the error state itself,
          // so this adapter throws a marker instead of a message-bearing
          // error (the outer catch must not stomp on that message).
          pushFn: async (payload) => {
            const outcome = await pushWorkout(payload);
            if (!outcome.success) throw new BridgePushFailedError();
            return {
              externalId: outcome.garminWorkoutId ?? `garmin-${Date.now()}`,
            };
          },
        }
      );
      analytics.event("garmin-synced", { result: "success" });
    } catch (error: unknown) {
      analytics.event("garmin-synced", { result: "failure" });
      if (error instanceof BridgePushFailedError) return;
      const message =
        error instanceof Error ? error.message : "Conversion failed";
      setPushing({ status: "error", message });
    }
  }, [workout, sessionActive, pushWorkout, setPushing, analytics]);

  return { push };
};
