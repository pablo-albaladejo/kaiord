import { krdToTrainingPeaksWorkout } from "@kaiord/trainingpeaks";
import { useCallback } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { checkTrainingPeaksSession } from "../adapters/trainingpeaks/trainingpeaks-transport";
import { executeWorkoutPush } from "../application/export/execute-workout-push";
import { toTrainingPeaksThresholds } from "../application/trainingpeaks/trainingpeaks-thresholds";
import { useAnalytics } from "../contexts";
import type { WorkoutRecord } from "../types/calendar-record";
import {
  buildTrainingPeaksPushFn,
  ledgerRepo,
  policyRepo,
  TRAININGPEAKS_BRIDGE_ID,
} from "./trainingpeaks-push-fn";
import { useActiveProfileLive } from "./use-active-profile-live";

export type TrainingPeaksPushOutcome =
  /**
   * `workoutId` is absent on a `lost-race` outcome, where another caller owns
   * the in-flight POST — the push still succeeded, this caller just does not
   * own the id. Callers must not assume an id is always there.
   */
  { ok: true; workoutId: string | undefined } | { ok: false; message: string };

/**
 * Pushes a persisted workout to the athlete's TrainingPeaks calendar.
 *
 * Mirrors `useGarminPush`: it takes the Dexie-backed `WorkoutRecord` (never
 * the editor's Zustand draft), routes through `executeWorkoutPush` so an
 * absent or disabled export route fails closed with a visible cause, and
 * leaves the `pushed` state transition to `useEditorActions`.
 *
 * The athlete id comes from a live session probe rather than storage, because
 * it is the id the bridge will actually write against. Intensity thresholds
 * come from the active profile's zones for the workout's sport; without them
 * the converter still produces a workout, warning for each target it had to
 * drop.
 */
export const useTrainingPeaksPush = (workout: WorkoutRecord | undefined) => {
  const analytics = useAnalytics();
  const profile = useActiveProfileLive()?.profile ?? null;

  const push = useCallback(async (): Promise<TrainingPeaksPushOutcome> => {
    if (!workout?.krd) return { ok: false, message: "Workout has no KRD" };
    const extensionId = bridgeDiscovery.getExtensionId(TRAININGPEAKS_BRIDGE_ID);
    if (!extensionId) {
      return { ok: false, message: "TrainingPeaks bridge is not installed" };
    }

    try {
      const session = await checkTrainingPeaksSession(extensionId);
      if (!session.authenticated || session.athleteId === undefined) {
        return { ok: false, message: "Sign in to TrainingPeaks and retry" };
      }
      const payload = krdToTrainingPeaksWorkout(workout.krd, {
        athleteId: session.athleteId,
        workoutDay: workout.date,
        thresholds: toTrainingPeaksThresholds(
          profile?.sportZones,
          workout.sport,
          profile?.maxHeartRate
        ),
      });
      const result = await executeWorkoutPush(
        { policyRepo, ledgerRepo },
        {
          profileId: workout.profileId,
          kaiordRecordId: workout.id,
          destinationBridgeId: TRAININGPEAKS_BRIDGE_ID,
          payload: { ...payload },
          pushFn: buildTrainingPeaksPushFn(extensionId),
        }
      );
      analytics.event("trainingpeaks-workout-pushed", { result: "success" });
      return { ok: true, workoutId: result.externalId };
    } catch (error: unknown) {
      analytics.event("trainingpeaks-workout-pushed", { result: "failure" });
      const message =
        error instanceof Error ? error.message : "TrainingPeaks push failed";
      return { ok: false, message };
    }
  }, [workout, profile, analytics]);

  return { push };
};
