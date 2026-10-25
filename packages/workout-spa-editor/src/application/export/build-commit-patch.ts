/**
 * buildCommitPatch — the only patch `commitByKey` applies, on both the
 * created and the updated path, so the two can never drift apart.
 *
 * It records the destination id, content hash and export time, persists the
 * library state the push reported (when it reported one) and clears
 * `forceRepush`: a successful library push is exactly what that flag asked
 * for. A push that reports no `library` (every non-Garmin destination) leaves
 * the row's `library` as it was. Likewise a `destinationDate` (the day a
 * TrainingPeaks copy sits on) is set when given and kept when not, so a
 * destination without one never gains it.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { GarminLibraryState } from "../../types/garmin-ledger";

/** What a destination push resolves with. */
export type ExportPushResult = {
  externalId: string;
  library?: GarminLibraryState;
};

export type CommitPatch = (row: ExportLedgerEntry) => ExportLedgerEntry;

export const buildCommitPatch = (input: {
  pushed: ExportPushResult;
  contentHash: string;
  exportedAt: string;
  destinationDate?: string;
}): CommitPatch => {
  const { pushed, contentHash, exportedAt, destinationDate } = input;
  return (row) => {
    const next: ExportLedgerEntry = {
      ...row,
      destinationExternalId: pushed.externalId,
      contentHash,
      exportedAt,
    };
    if (pushed.library) next.library = pushed.library;
    if (destinationDate !== undefined) next.destinationDate = destinationDate;
    delete next.forceRepush;
    return next;
  };
};
