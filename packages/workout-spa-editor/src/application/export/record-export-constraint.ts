/**
 * handleConstraintResult — resolves the outcome when insertPending returns
 * { ok: false; reason: 'constraint' } (a row already exists for the natural key).
 *
 * The checks run in this order, each on its own explicit field:
 *   1. pending      — another caller owns the in-flight POST → lost-race.
 *                     Checked BEFORE the hash: a pending row carries the hash
 *                     of a POST that has not committed, so an equal hash there
 *                     says nothing. A pending row older than PENDING_TTL_MS is
 *                     an abandoned POST (closed tab, crash) and is recovered
 *                     by re-pushing through the updated path.
 *   2. forceRepush  — the destination lost the pushed copy → updated.
 *   3. equal hash   — nothing changed → skipped.
 *   4. otherwise    — stale committed row → updated.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { buildCommitPatch } from "./build-commit-patch";
import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import { commitByKey } from "./record-export-commit";
import type { ExportPushFn, RecordExportResult } from "./record-export-post";

export const PENDING_TTL_MS = 5 * 60_000;

export type ConstraintInput = {
  ledgerRepo: ExportLedgerRepository;
  kaiordRecordId: string;
  destinationBridgeId: string;
  contentHash: string;
  payload: Record<string, unknown>;
  postFn: ExportPushFn;
  now: string;
};

/** A pending row is live until PENDING_TTL_MS after its (clamped) export
    time; a future `exportedAt` counts as now, an unreadable one as stale. */
const isLivePending = (row: ExportLedgerEntry, now: string): boolean => {
  if (row.destinationExternalId !== "pending") return false;
  const nowMs = Date.parse(now);
  const exportedMs = Date.parse(row.exportedAt);
  if (Number.isNaN(exportedMs)) return false;
  return nowMs - Math.min(exportedMs, nowMs) <= PENDING_TTL_MS;
};

export const handleConstraintResult = async (
  input: ConstraintInput
): Promise<RecordExportResult> => {
  const { ledgerRepo, kaiordRecordId, destinationBridgeId } = input;
  const { contentHash, now } = input;
  const existing = await ledgerRepo.findByNaturalKey({
    kaiordRecordId,
    destinationBridgeId,
  });

  if (!existing) {
    throw new Error("exportLedger: constraint violated but no row found");
  }
  if (isLivePending(existing, now)) {
    return { ledgerId: existing.id, outcome: "lost-race" };
  }
  // A stale pending row falls through: its hash was never confirmed.
  const isCommitted = existing.destinationExternalId !== "pending";
  if (
    isCommitted &&
    !existing.forceRepush &&
    existing.contentHash === contentHash
  ) {
    return {
      ledgerId: existing.id,
      outcome: "skipped",
      externalId: existing.destinationExternalId,
      library: existing.library,
    };
  }

  // Update remote, then commit by natural key through the shared patch.
  const pushed = await input.postFn(input.payload);
  const ledgerId = await commitByKey(
    ledgerRepo,
    existing,
    buildCommitPatch({ pushed, contentHash, exportedAt: now })
  );
  return {
    ledgerId,
    outcome: "updated",
    externalId: pushed.externalId,
    library: pushed.library,
  };
};
