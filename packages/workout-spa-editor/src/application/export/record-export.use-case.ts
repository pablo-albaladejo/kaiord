import type { Analytics, ManagedDataType } from "@kaiord/core";

import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import {
  computeExportHash,
  emitExportAnalytics,
} from "./record-export-analytics";
import { handleConstraintResult } from "./record-export-constraint";
import {
  postAndCommit,
  type RecordExportOutcome,
  type RecordExportResult,
} from "./record-export-post";

export type { RecordExportOutcome, RecordExportResult };

export type RecordExportDeps = {
  ledgerRepo: ExportLedgerRepository;
  analytics?: Analytics;
};

export type RecordExportInput = {
  kaiordRecordId: string;
  dataType: ManagedDataType;
  destinationBridgeId: string;
  payload: Record<string, unknown>;
  postFn: (payload: Record<string, unknown>) => Promise<{ externalId: string }>;
};

export const recordExport = async (
  deps: RecordExportDeps,
  input: RecordExportInput
): Promise<RecordExportResult> => {
  const { ledgerRepo } = deps;
  const { kaiordRecordId, dataType, destinationBridgeId, payload, postFn } =
    input;
  const contentHash = computeExportHash(dataType, payload);
  const ledgerId = crypto.randomUUID();
  const now = new Date().toISOString();
  const t0 = Date.now();
  const pending = {
    id: ledgerId,
    kaiordRecordId,
    dataType,
    destinationBridgeId,
    destinationExternalId: "pending",
    contentHash,
    exportedAt: now,
  };
  const insertResult = await ledgerRepo.insertPending(pending);
  if (!insertResult.ok) {
    const result = await handleConstraintResult(
      ledgerRepo,
      kaiordRecordId,
      destinationBridgeId,
      contentHash,
      payload,
      postFn,
      now
    );
    await emitExportAnalytics(
      deps.analytics,
      ledgerRepo,
      dataType,
      destinationBridgeId,
      result.outcome,
      Date.now() - t0
    );
    return result;
  }
  const externalId = await postAndCommit({
    ledgerRepo,
    analytics: deps.analytics,
    dataType,
    destinationBridgeId,
    ledgerId,
    payload,
    postFn,
    t0,
  });
  return { ledgerId, outcome: "created", externalId };
};
