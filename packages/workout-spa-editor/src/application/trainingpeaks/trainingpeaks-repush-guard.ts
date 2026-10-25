import type { ExportLedgerEntry } from "../../types/export-ledger";

export type RepushBlock =
  { reason: "moved"; recordedDate: string } | { reason: "changed" };

export type RepushVerdict =
  { blocked: false } | ({ blocked: true } & RepushBlock);

/**
 * TrainingPeaks is create-only for Kaiord, so re-sending a workout whose
 * pushed copy differs creates a second copy. A pending row, a forced re-push
 * (the destination lost its copy) and an unchanged payload are not blocked.
 */
export const trainingPeaksRepushGuard = (
  row: ExportLedgerEntry | undefined,
  workout: { date: string },
  payloadHash: string
): RepushVerdict => {
  if (!row || row.destinationExternalId === "pending")
    return { blocked: false };
  if (row.forceRepush || row.contentHash === payloadHash) {
    return { blocked: false };
  }
  const recordedDate = row.destinationDate;
  if (recordedDate !== undefined && recordedDate !== workout.date) {
    return { blocked: true, reason: "moved", recordedDate };
  }
  return { blocked: true, reason: "changed" };
};
