import { useCallback } from "react";

import { logGarminPushFailure } from "../../../application/garmin-placement/log-garmin-push-failure";
import { pushWorkoutToGarminCalendar } from "../../../application/garmin-placement/push-workout-to-garmin-calendar";
import { useAnalytics, useGarminBridge } from "../../../contexts";
import { buildPlacementDeps } from "../../../hooks/garmin-placement-deps";
import { garminPlacementRequest } from "../../../hooks/garmin-placement-request";
import { exportRecordGcn } from "../../../hooks/garmin-record-gcn";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { MissingPaceZonesError } from "../../../utils/garmin-pace-zones";
import { garminPushReports } from "./garmin-push-reports";

export type GarminPushOptions = {
  /** The athlete chose "Send anyway" on an `uncertain` result. */
  sendAnyway?: boolean;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Conversion failed";

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
 * ⇒ `failed{no-export-route}` and no bridge call. A throw before the
 * pipeline starts still emits its one `garmin-calendar-placement` event.
 */
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
      const { synced, failedEarly } = garminPushReports(analytics, Date.now());
      const showError = (error: unknown) =>
        setPushing({ status: "error", message: errorMessage(error) });
      // Phase 1 folds a thrown push into `failed`; surface its message first.
      const guardedPush = (gcn: unknown) =>
        pushWorkout(gcn).catch((error: unknown) => {
          showError(error);
          throw error;
        });
      try {
        const deps = buildPlacementDeps(features, analytics);
        const gcn = await exportRecordGcn(workout.krd, workout.profileId);
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
        if (error instanceof MissingPaceZonesError)
          return failedEarly("missing-pace-zones");
        logGarminPushFailure(error);
        showError(error);
        return failedEarly();
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
