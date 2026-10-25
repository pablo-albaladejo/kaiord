import { computeExportHash } from "../application/export/record-export-analytics";
import {
  type RepushVerdict,
  trainingPeaksRepushGuard,
} from "../application/trainingpeaks/trainingpeaks-repush-guard";
import type { WorkoutRecord } from "../types/calendar-record";
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
