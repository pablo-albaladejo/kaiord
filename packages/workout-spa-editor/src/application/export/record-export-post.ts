import type { Analytics, ManagedDataType } from "@kaiord/core";

import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import { emitExportAnalytics } from "./record-export-analytics";

export type RecordExportOutcome =
  | "created"
  | "updated"
  | "skipped"
  | "lost-race";

export type RecordExportResult = {
  ledgerId: string;
  outcome: RecordExportOutcome;
};

export type PostAndCommitInput = {
  ledgerRepo: ExportLedgerRepository;
  analytics: Analytics | undefined;
  dataType: ManagedDataType;
  destinationBridgeId: string;
  ledgerId: string;
  payload: Record<string, unknown>;
  postFn: (p: Record<string, unknown>) => Promise<{ externalId: string }>;
  t0: number;
};

export const postAndCommit = async (
  input: PostAndCommitInput
): Promise<string> => {
  const { ledgerRepo, analytics, dataType, destinationBridgeId, t0 } = input;
  let externalId: string;
  try {
    ({ externalId } = await input.postFn(input.payload));
  } catch (postErr) {
    await ledgerRepo.deleteById(input.ledgerId);
    await emitExportAnalytics(
      analytics,
      ledgerRepo,
      dataType,
      destinationBridgeId,
      "error",
      Date.now() - t0
    );
    throw postErr;
  }
  await ledgerRepo.update(input.ledgerId, {
    destinationExternalId: externalId,
    exportedAt: new Date().toISOString(),
  });
  await emitExportAnalytics(
    analytics,
    ledgerRepo,
    dataType,
    destinationBridgeId,
    "created",
    Date.now() - t0
  );
  return externalId;
};
