import { useCallback } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { readTrainingPeaksAthleteId } from "../adapters/trainingpeaks/connector/trainingpeaks-athlete-transport";
import { useAnalytics } from "../contexts";
import type { WorkoutRecord } from "../types/calendar-record";
import { buildTrainingPeaksPayload } from "./trainingpeaks-payload";
import { toTrainingPeaksPushFailure } from "./trainingpeaks-push-failure";
import { TRAININGPEAKS_BRIDGE_ID } from "./trainingpeaks-push-fn";
import type {
  TrainingPeaksPushOptions,
  TrainingPeaksPushOutcome,
} from "./trainingpeaks-push-outcome";
import { checkBeforeTrainingPeaksSend } from "./trainingpeaks-repush-check";
import { sendTrainingPeaksPayload } from "./trainingpeaks-send-payload";
import {
  checkTrainingPeaksUnanswered,
  rememberIfUnanswered,
} from "./trainingpeaks-unanswered";
import { useActiveProfileLive } from "./use-active-profile-live";

export type {
  TrainingPeaksBlock,
  TrainingPeaksPushOptions,
  TrainingPeaksPushOutcome,
} from "./trainingpeaks-push-outcome";

/**
 * Pushes a persisted workout to the athlete's TrainingPeaks calendar.
 *
 * Mirrors `useGarminPush`: it takes the Dexie-backed `WorkoutRecord` (never
 * the editor's Zustand draft), routes through `executeWorkoutPush` so an
 * absent or disabled export route fails closed with a visible cause, and
 * leaves the `pushed` state transition to `useEditorActions`.
 *
 * The athlete id is read from the extension just before the write rather
 * than from storage, because it is the id the bridge will actually write
 * against; that read is where the extension mints its token. A verified
 * sign-out on it asks the athlete to sign in, any other failure says
 * TrainingPeaks is not answering. Intensity thresholds
 * come from the active profile's zones for the workout's sport; without them
 * the converter still produces a workout, warning for each target it had to
 * drop. A send whose answer never arrived is remembered, and the next one
 * reads that day first (`trainingpeaks-unanswered`).
 */
export const useTrainingPeaksPush = (workout: WorkoutRecord | undefined) => {
  const analytics = useAnalytics();
  const profile = useActiveProfileLive()?.profile ?? null;

  const push = useCallback(
    async (
      options?: TrainingPeaksPushOptions
    ): Promise<TrainingPeaksPushOutcome> => {
      if (!workout?.krd) return { ok: false, reason: "no-steps" };
      const extensionId = bridgeDiscovery.getExtensionId(
        TRAININGPEAKS_BRIDGE_ID
      );
      if (!extensionId) {
        return { ok: false, reason: "install" };
      }

      let payload: Record<string, unknown> | undefined;
      try {
        const unanswered = await checkTrainingPeaksUnanswered(
          extensionId,
          workout.id,
          options?.sendAnyway === true
        );
        if (unanswered.blocked) return { ok: false, block: unanswered };
        const athleteId = await readTrainingPeaksAthleteId(extensionId);
        payload = buildTrainingPeaksPayload(
          { ...workout, krd: workout.krd },
          athleteId,
          profile
        );
        const verdict = await checkBeforeTrainingPeaksSend(
          extensionId,
          workout,
          payload,
          options?.allowCopy === true
        );
        if (verdict.blocked) return { ok: false, block: verdict };
        const result = await sendTrainingPeaksPayload(
          extensionId,
          workout,
          payload
        );
        analytics.event("trainingpeaks-workout-pushed", { result: "success" });
        return { ok: true, workoutId: result.externalId };
      } catch (error: unknown) {
        analytics.event("trainingpeaks-workout-pushed", { result: "failure" });
        await rememberIfUnanswered(error, extensionId, workout.id, payload);
        return toTrainingPeaksPushFailure(error);
      }
    },
    [workout, profile, analytics]
  );

  return { push };
};
