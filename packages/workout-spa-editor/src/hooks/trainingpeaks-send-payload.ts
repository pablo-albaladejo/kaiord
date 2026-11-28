import { executeWorkoutPush } from "../application/export/execute-workout-push";
import type { WorkoutRecord } from "../types/calendar-record";
import {
  buildTrainingPeaksPushFn,
  ledgerRepo,
  policyRepo,
  TRAININGPEAKS_BRIDGE_ID,
} from "./trainingpeaks-push-fn";

/** The governed write of one built payload for `workout`. */
export const sendTrainingPeaksPayload = (
  extensionId: string,
  workout: WorkoutRecord,
  payload: Record<string, unknown>
) =>
  executeWorkoutPush(
    { policyRepo, ledgerRepo },
    {
      profileId: workout.profileId,
      kaiordRecordId: workout.id,
      destinationBridgeId: TRAININGPEAKS_BRIDGE_ID,
      payload,
      pushFn: buildTrainingPeaksPushFn(extensionId),
    }
  );
