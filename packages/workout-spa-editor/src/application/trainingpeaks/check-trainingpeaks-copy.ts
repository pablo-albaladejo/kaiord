/**
 * The live state is read before a TrainingPeaks write is decided (ADR
 * 0004), with the decision Garmin's placement shares (`readLiveState`):
 * only a confirmed absence of the copy Kaiord recorded counts, and then
 * the record is marked `forceRepush` in a guarded update (still the same
 * recorded copy), so the next send creates the copy again instead of
 * skipping it or asking about a copy that is not there. A read that proves
 * nothing changes nothing.
 */
import type { ExportLedgerRepository } from "../export/export-ledger-repository.port";
import { readLiveState } from "../safe-writes/live-state";
import type { TrainingPeaksCopyPort } from "./trainingpeaks-copy-port";

export type CheckCopyDeps = {
  ledgerRepo: ExportLedgerRepository;
  copies: TrainingPeaksCopyPort;
  destinationBridgeId: string;
};

export const checkTrainingPeaksCopy = async (
  deps: CheckCopyDeps,
  kaiordRecordId: string
): Promise<void> => {
  const key = { kaiordRecordId, destinationBridgeId: deps.destinationBridgeId };
  const row = await deps.ledgerRepo.findByNaturalKey(key);
  if (!row || row.destinationExternalId === "pending" || row.forceRepush)
    return;
  const recordedId = row.destinationExternalId;
  const { state } = await readLiveState(async () => ({
    state: await deps.copies.read(recordedId),
  }));
  if (state !== "absent") return;
  await deps.ledgerRepo.mutateByKey(key, (current) =>
    current?.destinationExternalId === recordedId
      ? { ...current, forceRepush: true }
      : undefined
  );
};
