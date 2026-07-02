import type { KRD } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import type { WhoopRecoveryRecord } from "../schemas/whoop-recovery.schema";
import { buildWhoopHealthMetadata } from "./whoop-health-metadata.builder";

const KRD_VERSION = "2.0" as const;
const SCORED = "SCORED";

/**
 * Maps a WHOOP recovery record to a KRD `hrv_summary`.
 *
 * Mapping (per plan Track W.3):
 * - `score.hrv_rmssd_milli` → `rMSSD` (the overnight HRV signal)
 * - `score.recovery_score` (0–100) → `hrv_summary.score` (readiness)
 * - `measurementWindow` is always `"overnight"` (WHOOP recovery derives
 *   from the preceding sleep cycle)
 *
 * Returns `undefined` when the record is not yet `SCORED`, has no `score`,
 * or reports a non-positive rMSSD — the adapter never fabricates a reading.
 * `score.resting_heart_rate` has no home on `hrv_summary`; the service joins
 * it onto the matching `sleep_record` instead.
 */
export const mapWhoopRecoveryToKrd = (
  recovery: WhoopRecoveryRecord
): KRD | undefined => {
  const score = recovery.score;
  if (recovery.score_state !== SCORED || !score) return undefined;
  if (score.hrv_rmssd_milli <= 0) return undefined;

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.hrv_summary,
    metadata: buildWhoopHealthMetadata(recovery.created_at),
    extensions: {
      health: {
        hrv: {
          kind: "hrv",
          version: KRD_VERSION,
          measuredAt: recovery.created_at,
          rMSSD: score.hrv_rmssd_milli,
          measurementWindow: "overnight",
          score: Math.round(score.recovery_score),
          externalId: recovery.sleep_id ?? String(recovery.cycle_id),
        },
      },
    },
  };
};
