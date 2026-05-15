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
 * Callers:
 * - `GarminPushButton.tsx` — reads the workout via `useLiveQuery` and passes
 *   the record. The editor pushes the last-persisted state.
 * - `CoachingActivityDialog.tsx` — reads the workout via the same Dexie path
 *   and passes the record from the matched session.
 *
 * Signature: useGarminPush(workout: WorkoutRecord | undefined): { push, ... }
 */
export const useGarminPush = (workout: WorkoutRecord | undefined) => {
  const { pushWorkout, setPushing, sessionActive } = useGarminBridge();
  const analytics = useAnalytics();

  const push = useCallback(async () => {
    if (!workout?.krd || !sessionActive) return;

    try {
      const gcn = await exportGcnWorkout(workout.krd);
      await pushWorkout(gcn);
      analytics.event("garmin-synced", { result: "success" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Conversion failed";
      setPushing({ status: "error", message });
      analytics.event("garmin-synced", { result: "failure" });
    }
  }, [workout, sessionActive, pushWorkout, setPushing, analytics]);

  return { push };
};
