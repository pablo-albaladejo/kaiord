import { useCallback } from "react";

import { useAnalytics, useGarminBridge } from "../../../contexts";
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
      // pushWorkout never rejects on a bridge-reported failure — it
      // resolves { success: false } and sets the error state itself.
      // Reading the result keeps this analytics event honest instead of
      // always reporting "success" once the promise settles.
      const outcome = await pushWorkout(gcn);
      analytics.event("garmin-synced", {
        result: outcome.success ? "success" : "failure",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Conversion failed";
      setPushing({ status: "error", message });
      analytics.event("garmin-synced", { result: "failure" });
    }
  }, [workout, sessionActive, pushWorkout, setPushing, analytics]);

  return { push };
};
