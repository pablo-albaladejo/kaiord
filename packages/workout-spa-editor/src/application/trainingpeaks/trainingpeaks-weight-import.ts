/**
 * Types + pure helpers for `syncTrainingPeaksWeight`. Kept out of the use-case
 * file so that stays under the per-file line cap.
 */
import type { KRD, ManagedDataType } from "@kaiord/core";
import { canonicalHash } from "@kaiord/core";

import type { CoachingSyncStateRepository } from "../../ports/persistence-port";
import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import { stampProvenance } from "../import/stamp-provenance";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { resolveImportPolicies } from "../integration-policy/resolve-import-policies.use-case";

export const TRAININGPEAKS_BRIDGE_ID = "trainingpeaks-bridge";
export const WEIGHT: ManagedDataType = "weight";

export type SyncTrainingPeaksWeightDeps = {
  policyRepo: IntegrationPolicyRepository;
  importedRecords: ImportedRecordRepository;
  /**
   * Resolves whether the bridge holds a live TrainingPeaks session. This is a
   * real cookie→token exchange against tpapi.trainingpeaks.com (see
   * trainingpeaks-bridge/tp-auth.js `checkTokenExchange`), NOT a local storage
   * read like WHOOP's `status` — so the policy gate must run BEFORE it.
   */
  checkSession: () => Promise<boolean>;
  readMetrics: (start: string, end: string) => Promise<unknown>;
  /** Injected so this layer never imports @kaiord/trainingpeaks directly. */
  parse: (response: unknown) => KRD[];
  /**
   * Freshness ledger. Required, not optional: an optional dep silently
   * no-ops at any future call site that forgets it, and the missing row
   * only surfaces as a blank "last synced" cell much later.
   */
  coachingSyncState: CoachingSyncStateRepository;
};

export type SyncTrainingPeaksWeightInput = {
  profileId: string;
  /** `YYYY-MM-DD` path segments for the consolidatedtimedmetrics range. */
  start: string;
  end: string;
};

export type SyncTrainingPeaksWeightResult =
  | { ok: true; imported: number; skipped: number }
  | {
      ok: false;
      reason: "no-policy" | "no-session" | "transport-error";
      error?: string;
    };

/** Fail-closed gate: no enabled `weight ← trainingpeaks-bridge` route, no fetch. */
export const isTrainingPeaksWeightEnabled = async (
  policyRepo: IntegrationPolicyRepository,
  profileId: string
): Promise<boolean> => {
  const policies = await resolveImportPolicies(
    { policyRepo },
    { profileId, dataType: WEIGHT }
  );
  return policies.some(
    (p) => p.enabled && p.bridgeId === TRAININGPEAKS_BRIDGE_ID
  );
};

export const persistWeightDocuments = async (
  recordRepo: ImportedRecordRepository,
  profileId: string,
  documents: readonly KRD[]
): Promise<{ imported: number; skipped: number }> => {
  let imported = 0;
  let skipped = 0;
  for (const krd of documents) {
    const weight = krd.extensions?.health?.weight;
    if (!weight?.measuredAt) continue;
    const { measuredAt } = weight;
    const externalId = canonicalHash({ dataType: WEIGHT, measuredAt });
    const { created } = await upsertImportedRecord(
      { recordRepo },
      {
        profileId,
        dataType: WEIGHT,
        date: measuredAt.slice(0, 10),
        payload: { ...weight },
        measuredAt,
        ...stampProvenance(TRAININGPEAKS_BRIDGE_ID, externalId),
      }
    );
    if (created) imported += 1;
    else skipped += 1;
  }
  return { imported, skipped };
};
