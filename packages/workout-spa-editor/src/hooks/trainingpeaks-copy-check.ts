import { readTrainingPeaksCopyState } from "../adapters/trainingpeaks/trainingpeaks-workout-transport";
import { checkTrainingPeaksCopy as checkCopy } from "../application/trainingpeaks/check-trainingpeaks-copy";
import type { WorkoutRecord } from "../types/calendar-record";
import { ledgerRepo, TRAININGPEAKS_BRIDGE_ID } from "./trainingpeaks-push-fn";

/** The copy check wired to the App's ledger and Kaiord for TrainingPeaks. */
export const checkTrainingPeaksCopy = (
  extensionId: string,
  workout: WorkoutRecord
): Promise<void> =>
  checkCopy(
    {
      ledgerRepo,
      destinationBridgeId: TRAININGPEAKS_BRIDGE_ID,
      copies: { read: (id) => readTrainingPeaksCopyState(extensionId, id) },
    },
    workout.id
  );
