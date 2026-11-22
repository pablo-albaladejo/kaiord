import { readTrainingPeaksCopyState } from "../adapters/trainingpeaks/trainingpeaks-workout-transport";
import type { WorkoutRecord } from "../types/calendar-record";
import { ledgerRepo, TRAININGPEAKS_BRIDGE_ID } from "./trainingpeaks-push-fn";

/**
 * Reads the live state before a write. When TrainingPeaks no longer holds
 * the copy Kaiord recorded, the record is marked `forceRepush`, as Garmin
 * does for a lost copy, so the next send creates it again instead of
 * skipping or asking about a copy that is not there.
 */
export const checkTrainingPeaksCopy = async (
  extensionId: string,
  workout: WorkoutRecord
): Promise<void> => {
  const key = {
    kaiordRecordId: workout.id,
    destinationBridgeId: TRAININGPEAKS_BRIDGE_ID,
  };
  const row = await ledgerRepo.findByNaturalKey(key);
  if (!row || row.destinationExternalId === "pending" || row.forceRepush)
    return;
  const recordedId = row.destinationExternalId;
  const state = await readTrainingPeaksCopyState(extensionId, recordedId);
  if (state !== "gone") return;
  await ledgerRepo.mutateByKey(key, (current) =>
    current?.destinationExternalId === recordedId
      ? { ...current, forceRepush: true }
      : undefined
  );
};
