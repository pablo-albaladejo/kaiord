/**
 * syncTrainingPeaksWeight — governed import of TrainingPeaks weight readings
 * (`consolidatedtimedmetrics` type 9) for a bounded date window.
 *
 * Gates on the import policy resolver BEFORE anything touches the network:
 * with no enabled `weight ← trainingpeaks-bridge` route neither the session
 * probe nor the metrics read runs. Order matters — `checkSession` is itself a
 * live token exchange, so it sits AFTER the policy gate. Each reading is
 * deduped by its stable
 * `(sourceBridgeId, externalId)` identity through the shared inbound upsert,
 * where `externalId` hashes `(dataType, measuredAt)` — the same derivation the
 * Tanita export ledger uses. Pure application layer: the bridge read and the
 * `@kaiord/trainingpeaks` parser are both injected.
 */
import type { KRD } from "@kaiord/core";

import {
  isTrainingPeaksWeightEnabled,
  persistWeightDocuments,
  type SyncTrainingPeaksWeightDeps,
  type SyncTrainingPeaksWeightInput,
  type SyncTrainingPeaksWeightResult,
} from "./trainingpeaks-weight-import";

export type {
  SyncTrainingPeaksWeightDeps,
  SyncTrainingPeaksWeightInput,
  SyncTrainingPeaksWeightResult,
};

export const syncTrainingPeaksWeight = async (
  deps: SyncTrainingPeaksWeightDeps,
  input: SyncTrainingPeaksWeightInput
): Promise<SyncTrainingPeaksWeightResult> => {
  const enabled = await isTrainingPeaksWeightEnabled(
    deps.policyRepo,
    input.profileId
  );
  if (!enabled) return { ok: false, reason: "no-policy" };

  let documents: KRD[];
  try {
    if (!(await deps.checkSession())) {
      return { ok: false, reason: "no-session" };
    }
    const response = await deps.readMetrics(input.start, input.end);
    documents = deps.parse(response);
  } catch (err) {
    return {
      ok: false,
      reason: "transport-error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const counts = await persistWeightDocuments(
    deps.importedRecords,
    input.profileId,
    documents
  );
  return { ok: true, ...counts };
};
