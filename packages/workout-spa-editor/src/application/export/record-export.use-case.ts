import type { Analytics, ManagedDataType } from "@kaiord/core";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import { destinationDateOf } from "./export-destination-date";
import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import {
  computeExportHash,
  emitExportAnalytics,
} from "./record-export-analytics";
import { handleConstraintResult } from "./record-export-constraint";
import {
  type ExportPushFn,
  postAndCommit,
  type RecordExportOutcome,
  type RecordExportResult,
} from "./record-export-post";

export type { ExportPushFn, RecordExportOutcome, RecordExportResult };

export type RecordExportDeps = {
  ledgerRepo: ExportLedgerRepository;
  analytics?: Analytics;
};

export type RecordExportInput = {
  kaiordRecordId: string;
  dataType: ManagedDataType;
  destinationBridgeId: string;
  payload: Record<string, unknown>;
  postFn: ExportPushFn;
};

export const recordExport = async (
  deps: RecordExportDeps,
  input: RecordExportInput
): Promise<RecordExportResult> => {
  const { ledgerRepo } = deps;
  const { kaiordRecordId, dataType, destinationBridgeId, payload, postFn } =
    input;
  const contentHash = computeExportHash(dataType, payload);
  const destinationDate = destinationDateOf(destinationBridgeId, payload);
  const common = { ledgerRepo, destinationBridgeId, payload, postFn };
  const ledgerId = crypto.randomUUID();
  const now = new Date().toISOString();
  const t0 = Date.now();
  const pending: ExportLedgerEntry = {
    id: ledgerId,
    kaiordRecordId,
    dataType,
    destinationBridgeId,
    destinationExternalId: "pending",
    contentHash,
    exportedAt: now,
    updatedAt: now,
  };
  const insertResult = await ledgerRepo.insertPending(pending);
  if (!insertResult.ok) {
    const result = await handleConstraintResult({
      ...common,
      kaiordRecordId,
      contentHash,
      now,
      destinationDate,
    });
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
  const committed = await postAndCommit({
    ...common,
    analytics: deps.analytics,
    dataType,
    pending,
    t0,
    destinationDate,
  });
  return { ...committed, outcome: "created" };
};
