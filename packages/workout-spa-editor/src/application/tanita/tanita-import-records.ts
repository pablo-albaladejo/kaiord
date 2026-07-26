/**
 * Types + pure helpers for `syncTanitaImport`. Kept out of the use-case file
 * so that stays under the per-file line cap.
 */
import type { KRD, ManagedDataType } from "@kaiord/core";
import { canonicalHash } from "@kaiord/core";

import type { CoachingSyncStateRepository } from "../../ports/persistence-port";
import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import { stampProvenance } from "../import/stamp-provenance";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";

export const TANITA_BRIDGE_ID = "tanita-bridge";

export type TanitaImportFlags = { weight: boolean; bodyComposition: boolean };

export type SyncTanitaImportDeps = {
  policyRepo: IntegrationPolicyRepository;
  importedRecords: ImportedRecordRepository;
  readCsv: () => Promise<string>;
  /** Injected so this layer never imports @kaiord/tanita directly. */
  parse: (csv: string) => KRD[];
  /**
   * Freshness ledger. Required, not optional: an optional dep silently
   * no-ops at any future call site that forgets it, and the missing row
   * only surfaces as a blank "last synced" cell much later.
   */
  coachingSyncState: CoachingSyncStateRepository;
};

export type SyncTanitaImportInput = { profileId: string };

export type SyncTanitaImportResult =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; reason: "no-policy" | "transport-error"; error?: string };

export type PendingTanitaRecord = {
  dataType: ManagedDataType;
  measuredAt: string;
  payload: Record<string, unknown>;
};

/**
 * One Tanita row yields ONE KRD that can carry BOTH a weight measurement and a
 * body-composition snapshot, so extraction is per EXTENSION — never per
 * `krd.type`, which would drop whichever half the document is not named after.
 */
export const toPendingRecords = (
  krd: KRD,
  flags: TanitaImportFlags
): PendingTanitaRecord[] => {
  const health = krd.extensions?.health;
  const pending: PendingTanitaRecord[] = [];
  const weight = health?.weight;
  if (flags.weight && weight?.measuredAt) {
    pending.push({
      dataType: "weight",
      measuredAt: weight.measuredAt,
      payload: { ...weight },
    });
  }
  const bodyComposition = health?.bodyComposition;
  if (flags.bodyComposition && bodyComposition?.measuredAt) {
    pending.push({
      dataType: "body-composition",
      measuredAt: bodyComposition.measuredAt,
      payload: { ...bodyComposition },
    });
  }
  return pending;
};

export const persistPendingRecords = async (
  recordRepo: ImportedRecordRepository,
  profileId: string,
  documents: readonly KRD[],
  flags: TanitaImportFlags
): Promise<{ imported: number; skipped: number }> => {
  let imported = 0;
  let skipped = 0;
  for (const krd of documents) {
    for (const { dataType, measuredAt, payload } of toPendingRecords(
      krd,
      flags
    )) {
      const externalId = canonicalHash({ dataType, measuredAt });
      const { created } = await upsertImportedRecord(
        { recordRepo },
        {
          profileId,
          dataType,
          date: measuredAt.slice(0, 10),
          payload,
          measuredAt,
          ...stampProvenance(TANITA_BRIDGE_ID, externalId),
        }
      );
      if (created) imported += 1;
      else skipped += 1;
    }
  }
  return { imported, skipped };
};
