import { useCallback } from "react";

import { db } from "../../../adapters/dexie/dexie-database";
import { recordGarminPush } from "../../../application/record-garmin-push";
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
 * On a confirmed push the record is re-persisted with the Garmin-assigned
 * id (`recordGarminPush`), so the calendar lifecycle badge reflects the
 * push regardless of which surface triggered it.
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
      const outcome = await pushWorkout(gcn);
      if (outcome.success) {
        const pushId = outcome.garminWorkoutId ?? `garmin-${Date.now()}`;
        // Re-read before persisting: the record may have been edited while
        // the push was in flight, and writing the captured copy back would
        // silently drop those edits.
        const fresh = (await db.table("workouts").get(workout.id)) as
          | WorkoutRecord
          | undefined;
        await db
          .table("workouts")
          .put(recordGarminPush(fresh ?? workout, pushId));
      }
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
