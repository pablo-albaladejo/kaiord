import type { Analytics, ManagedDataType } from "@kaiord/core";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { GarminLibraryState } from "../../types/garmin-ledger";
import { buildCommitPatch, type ExportPushResult } from "./build-commit-patch";
import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import { emitExportAnalytics } from "./record-export-analytics";
import { commitByKey } from "./record-export-commit";

export type RecordExportOutcome =
  "created" | "updated" | "skipped" | "lost-race";

export type RecordExportResult = {
  ledgerId: string;
  outcome: RecordExportOutcome;
  /** Destination-assigned id from the push response. Absent for
      "lost-race" (another caller owns the in-flight POST). */
  externalId?: string;
  /** Library state of the pushed (created/updated) or kept (skipped) row. */
  library?: GarminLibraryState;
};

export type ExportPushFn = (
  payload: Record<string, unknown>
) => Promise<ExportPushResult>;

export type PostAndCommitInput = {
  ledgerRepo: ExportLedgerRepository;
  analytics: Analytics | undefined;
  dataType: ManagedDataType;
  destinationBridgeId: string;
  /** The pending row this export inserted; the commit re-inserts it if gone. */
  pending: ExportLedgerEntry;
  payload: Record<string, unknown>;
  postFn: ExportPushFn;
  t0: number;
};

export const postAndCommit = async (
  input: PostAndCommitInput
): Promise<Omit<RecordExportResult, "outcome">> => {
  const { ledgerRepo, analytics, dataType, destinationBridgeId, t0 } = input;
  let pushed: ExportPushResult;
  try {
    pushed = await input.postFn(input.payload);
  } catch (postErr) {
    await ledgerRepo.rollbackPending(input.pending.id);
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
  const ledgerId = await commitByKey(
    ledgerRepo,
    input.pending,
    buildCommitPatch({
      pushed,
      contentHash: input.pending.contentHash,
      exportedAt: new Date().toISOString(),
    })
  );
  await emitExportAnalytics(
    analytics,
    ledgerRepo,
    dataType,
    destinationBridgeId,
    "created",
    Date.now() - t0
  );
  return { ledgerId, externalId: pushed.externalId, library: pushed.library };
};
