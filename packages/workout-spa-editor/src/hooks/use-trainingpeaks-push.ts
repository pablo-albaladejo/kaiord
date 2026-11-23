import { useCallback } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { checkTrainingPeaksSession } from "../adapters/trainingpeaks/trainingpeaks-transport";
import { executeWorkoutPush } from "../application/export/execute-workout-push";
import type { RepushVerdict } from "../application/trainingpeaks/trainingpeaks-repush-guard";
import { useAnalytics } from "../contexts";
import type { WorkoutRecord } from "../types/calendar-record";
import { buildTrainingPeaksPayload } from "./trainingpeaks-payload";
import {
  athleteIdOrRefusal,
  toTrainingPeaksPushFailure,
  type TrainingPeaksPushFailureOutcome,
} from "./trainingpeaks-push-failure";
import {
  buildTrainingPeaksPushFn,
  ledgerRepo,
  policyRepo,
  TRAININGPEAKS_BRIDGE_ID,
} from "./trainingpeaks-push-fn";
import { checkBeforeTrainingPeaksSend } from "./trainingpeaks-repush-check";
import { useActiveProfileLive } from "./use-active-profile-live";

export type TrainingPeaksPushOutcome =
  /**
   * `workoutId` is absent on a `lost-race` outcome, where another caller owns
   * the in-flight POST — the push still succeeded, this caller just does not
   * own the id. Callers must not assume an id is always there.
   */
  | { ok: true; workoutId: string | undefined }
  | TrainingPeaksPushFailureOutcome
  /** A changed workout TrainingPeaks already holds; `allowCopy` overrides. */
  | { ok: false; block: Extract<RepushVerdict, { blocked: true }> };

export type TrainingPeaksPushOptions = { allowCopy?: boolean };

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

  const push = useCallback(
    async (
      options?: TrainingPeaksPushOptions
    ): Promise<TrainingPeaksPushOutcome> => {
      if (!workout?.krd) return { ok: false, message: "Workout has no KRD" };
      const extensionId = bridgeDiscovery.getExtensionId(
        TRAININGPEAKS_BRIDGE_ID
      );
      if (!extensionId) {
        return { ok: false, message: "TrainingPeaks bridge is not installed" };
      }

      try {
        const probed = athleteIdOrRefusal(
          await checkTrainingPeaksSession(extensionId)
        );
        if ("ok" in probed) return probed;
        const payload = buildTrainingPeaksPayload(
          { ...workout, krd: workout.krd },
          probed.athleteId,
          profile
        );
        const verdict = await checkBeforeTrainingPeaksSend(
          extensionId,
          workout,
          payload,
          options?.allowCopy === true
        );
        if (verdict.blocked) return { ok: false, block: verdict };
        const result = await executeWorkoutPush(
          { policyRepo, ledgerRepo },
          {
            profileId: workout.profileId,
            kaiordRecordId: workout.id,
            destinationBridgeId: TRAININGPEAKS_BRIDGE_ID,
            payload,
            pushFn: buildTrainingPeaksPushFn(extensionId),
          }
        );
        analytics.event("trainingpeaks-workout-pushed", { result: "success" });
        return { ok: true, workoutId: result.externalId };
      } catch (error: unknown) {
        analytics.event("trainingpeaks-workout-pushed", { result: "failure" });
        return toTrainingPeaksPushFailure(error);
      }
    },
    [workout, profile, analytics]
  );

  return { push };
};
