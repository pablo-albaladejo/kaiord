/**
 * recordExport — insert-pending → POST → UPDATE idempotency protocol.
 *
 * The unique index &[kaiordRecordId+destinationBridgeId] on exportLedger
 * acts as a mutex: only one caller can insert a 'pending' row for a given
 * (kaiordRecordId, destinationBridgeId) pair. The second concurrent
 * caller receives { ok: false; reason: 'constraint' } from insertPending
 * and returns 'lost-race' without ever calling postFn. This closes the
 * concurrent-trigger race (AC-8).
 */
import type { ManagedDataType } from "@kaiord/core";
import { canonicalHash, MANAGED_DATA_REGISTRY } from "@kaiord/core";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import { handleConstraintResult } from "./record-export-constraint";

export type RecordExportDeps = {
  ledgerRepo: ExportLedgerRepository;
};

export type RecordExportInput = {
  kaiordRecordId: string;
  dataType: ManagedDataType;
  destinationBridgeId: string;
  payload: Record<string, unknown>;
  postFn: (payload: Record<string, unknown>) => Promise<{ externalId: string }>;
};

export type RecordExportOutcome =
  | "created"
  | "updated"
  | "skipped"
  | "lost-race";

export type RecordExportResult = {
  ledgerId: string;
  outcome: RecordExportOutcome;
};

const computeHash = (
  dataType: ManagedDataType,
  payload: Record<string, unknown>
): string => {
  const entry = MANAGED_DATA_REGISTRY[dataType];
  const projected = entry?.hashProjection
    ? entry.hashProjection(payload)
    : payload;
  return canonicalHash(projected as Record<string, unknown>);
};

export const recordExport = async (
  deps: RecordExportDeps,
  input: RecordExportInput
): Promise<RecordExportResult> => {
  const { ledgerRepo } = deps;
  const { kaiordRecordId, dataType, destinationBridgeId, payload, postFn } =
    input;
  const contentHash = computeHash(dataType, payload);
  const ledgerId = crypto.randomUUID();
  const now = new Date().toISOString();

  const pending: ExportLedgerEntry = {
    id: ledgerId,
    kaiordRecordId,
    dataType,
    destinationBridgeId,
    destinationExternalId: "pending",
    contentHash,
    exportedAt: now,
  };

  // Step 1: attempt insert of pending row — races are gated here.
  const insertResult = await ledgerRepo.insertPending(pending);

  if (!insertResult.ok) {
    return handleConstraintResult(
      ledgerRepo,
      kaiordRecordId,
      destinationBridgeId,
      contentHash,
      payload,
      postFn,
      now
    );
  }

  // Step 2: we won the race — call postFn.
  let externalId: string;
  try {
    ({ externalId } = await postFn(payload));
  } catch (postErr) {
    await ledgerRepo.deleteById(ledgerId);
    throw postErr;
  }

  // Step 3: commit — update pending row with real externalId.
  await ledgerRepo.update(ledgerId, {
    destinationExternalId: externalId,
    exportedAt: new Date().toISOString(),
  });
  return { ledgerId, outcome: "created" };
};
