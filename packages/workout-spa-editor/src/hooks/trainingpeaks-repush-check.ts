import { computeExportHash } from "../application/export/record-export-analytics";
import {
  type RepushVerdict,
  trainingPeaksRepushGuard,
} from "../application/trainingpeaks/trainingpeaks-repush-guard";
import type { WorkoutRecord } from "../types/calendar-record";
import { checkTrainingPeaksCopy } from "./trainingpeaks-copy-check";
import { ledgerRepo, TRAININGPEAKS_BRIDGE_ID } from "./trainingpeaks-push-fn";

/** Runs after the session probe: the hash covers the probed athlete id. */
export const checkTrainingPeaksRepush = async (
  workout: WorkoutRecord,
  payload: Record<string, unknown>
): Promise<RepushVerdict> => {
  const row = await ledgerRepo.findByNaturalKey({
    kaiordRecordId: workout.id,
    destinationBridgeId: TRAININGPEAKS_BRIDGE_ID,
  });
  return trainingPeaksRepushGuard(
    row,
    workout,
    computeExportHash("workout", payload)
  );
};

/** Reads the live copy first, then applies the re-push guard unless the
    athlete already chose to send a copy. */
export const checkBeforeTrainingPeaksSend = async (
  extensionId: string,
  workout: WorkoutRecord,
  payload: Record<string, unknown>,
  allowCopy: boolean
): Promise<RepushVerdict> => {
  await checkTrainingPeaksCopy(extensionId, workout);
  return allowCopy
    ? { blocked: false }
    : checkTrainingPeaksRepush(workout, payload);
};
