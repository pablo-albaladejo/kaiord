import { useCallback } from "react";

import { executeWorkoutPush } from "../../../application/export/execute-workout-push";
import { useAnalytics, useGarminBridge } from "../../../contexts";
import {
  BridgePushFailedError,
  buildGarminPushFn,
  GARMIN_BRIDGE_ID,
  ledgerRepo,
  policyRepo,
} from "../../../hooks/garmin-push-fn";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

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
          pushFn: buildGarminPushFn(pushWorkout),
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
