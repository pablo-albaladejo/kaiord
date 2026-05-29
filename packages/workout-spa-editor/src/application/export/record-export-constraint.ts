/**
 * handleConstraintResult — resolves the outcome when insertPending returns
 * { ok: false; reason: 'constraint' } (a row already exists for the natural key).
 *
 * Three cases:
 *   skipped   — same contentHash, nothing to do
 *   lost-race — existing row is still pending, another caller owns the work
 *   updated   — stale committed row, re-POST and update the ledger
 */
import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import type { RecordExportResult } from "./record-export-post";

export const handleConstraintResult = async (
  ledgerRepo: ExportLedgerRepository,
  kaiordRecordId: string,
  destinationBridgeId: string,
  contentHash: string,
  payload: Record<string, unknown>,
  postFn: (p: Record<string, unknown>) => Promise<{ externalId: string }>,
  now: string
): Promise<RecordExportResult> => {
  const existing = await ledgerRepo.findByNaturalKey({
    kaiordRecordId,
    destinationBridgeId,
  });

  if (!existing) {
    throw new Error("exportLedger: constraint violated but no row found");
  }

  if (existing.contentHash === contentHash) {
    return { ledgerId: existing.id, outcome: "skipped" };
  }
  if (existing.destinationExternalId === "pending") {
    return { ledgerId: existing.id, outcome: "lost-race" };
  }

  // Stale committed row — update remote then update ledger.
  const { externalId } = await postFn(payload);
  await ledgerRepo.update(existing.id, {
    destinationExternalId: externalId,
    contentHash,
    exportedAt: now,
  });
  return { ledgerId: existing.id, outcome: "updated" };
};
