import { useCallback } from "react";

import {
  failed,
  isPlacementSent,
  type PlacementResult,
} from "../../../application/garmin-placement/placement-result";
import { pushWorkoutToGarminCalendar } from "../../../application/garmin-placement/push-workout-to-garmin-calendar";
import { useAnalytics, useGarminBridge } from "../../../contexts";
import { buildPlacementDeps } from "../../../hooks/garmin-placement-deps";
import { garminPlacementRequest } from "../../../hooks/garmin-placement-request";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

export type GarminPushOptions = {
  /** The athlete chose "Send anyway" on an `uncertain` result. */
  sendAnyway?: boolean;
};

/**
 * Pushes a persisted workout to Garmin Connect and places it on its date
 * in the Garmin calendar (`pushWorkoutToGarminCalendar`), resolving with
 * the `PlacementResult`, or `undefined` when there is nothing to push (no
 * workout, or no Garmin session).
 *
 * The hook accepts the persisted Dexie `WorkoutRecord` directly; it does NOT
 * read from the editor's Zustand draft store. Callers MUST pass the
 * Dexie-backed record (read via `useLiveQuery`), not the in-memory editor
 * draft.
 *
 * It does NOT persist the `pushed` state transition — that stays owned by
 * `useEditorActions`, which `onSent` feeds: it fires with the Garmin
 * library workout id iff the library push is confirmed.
 *
 * Governed like every export: no active, enabled export route to Garmin
 * ⇒ `failed{no-export-route}` and no bridge call.
 */
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Conversion failed";

export const useGarminPush = (
  workout: WorkoutRecord | undefined,
  onSent?: (garminWorkoutId: string) => void
) => {
  const { pushWorkout, setPushing, sessionActive, features } =
    useGarminBridge();
  const analytics = useAnalytics();

  const push = useCallback(
    async (options: GarminPushOptions = {}) => {
      if (!workout?.krd || !sessionActive) return undefined;
      const showError = (error: unknown) =>
        setPushing({ status: "error", message: errorMessage(error) });
      // Phase 1 folds a thrown push into `failed`; surface its message first.
      const guardedPush = (gcn: unknown) =>
        pushWorkout(gcn).catch((error: unknown) => {
          showError(error);
          throw error;
        });
      const synced = (result: PlacementResult) =>
        analytics.event("garmin-synced", {
          result: isPlacementSent(result) ? "success" : "failure",
        });
      try {
        const deps = buildPlacementDeps(features, analytics);
        const gcn = await exportGcnWorkout(workout.krd);
        // A joiner's run is the owner's: only the owner reports it.
        return await pushWorkoutToGarminCalendar(
          deps,
          garminPlacementRequest(
            {
              record: workout,
              gcn,
              ledgerRepo: deps.ledgerRepo,
              pushWorkout: guardedPush,
            },
            {
              onLibraryConfirmed: onSent,
              sendAnyway: options.sendAnyway,
              onSettled: synced,
            }
          )
        );
      } catch (error: unknown) {
        showError(error);
        const result = failed("library-push-failed", true);
        synced(result);
        return result;
      }
    },
    [
      workout,
      sessionActive,
      features,
      pushWorkout,
      setPushing,
      analytics,
      onSent,
    ]
  );

  return { push };
};
