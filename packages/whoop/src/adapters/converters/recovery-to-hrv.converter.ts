import type { HrvSummary } from "@kaiord/core";

import type {
  WhoopCycle,
  WhoopCycleRecovery,
} from "../schemas/whoop-cycles.schema";

const KRD_VERSION = "2.0" as const;
const SOURCE_BRIDGE_ID = "whoop-bridge";
const RMSSD_S_TO_MS = 1000;

/**
 * Maps a WHOOP cycle `recovery` to `extensions.health.hrv`. WHOOP reports
 * RMSSD in seconds, so `rMSSD` is `hrv_rmssd * 1000` (e.g. 0.0571 → 57.1 ms).
 * The reading is always overnight (recovery derives from the night's sleep).
 * The `externalId` is cycle-scoped so re-syncs upsert without duplicates.
 */
export const recoveryToHrv = (
  recovery: WhoopCycleRecovery,
  cycle: WhoopCycle
): HrvSummary => ({
  kind: "hrv",
  version: KRD_VERSION,
  measuredAt: recovery.created_at,
  rMSSD: recovery.hrv_rmssd * RMSSD_S_TO_MS,
  measurementWindow: "overnight",
  score: Math.round(recovery.recovery_score),
  sourceBridgeId: SOURCE_BRIDGE_ID,
  externalId: `cycle:${cycle.id}:hrv`,
});
