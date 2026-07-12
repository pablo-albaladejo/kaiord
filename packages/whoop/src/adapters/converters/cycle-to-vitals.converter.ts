import type { VitalsSummary } from "@kaiord/core";

import type { WhoopCycleRecord } from "../schemas/whoop-cycles.schema";

const KRD_VERSION = "2.0" as const;
const SOURCE_BRIDGE_ID = "whoop-bridge";

/**
 * Folds a WHOOP cycle's `recovery` and first `sleeps[]` entry into a single
 * `extensions.health.vitals` payload. WHOOP scatters these four measurements
 * across the cycle rather than reporting them as one vitals record, so this
 * converter produces at most one vitals summary per cycle, timestamped at
 * `recovery.created_at`. Measurements WHOOP didn't report (e.g. no sleep
 * entry, or `skin_temp_celsius` absent without a 4.0 strap) are omitted from
 * the result rather than set to a placeholder. If none of the four
 * measurements are present, returns `null` so the caller can skip the cycle.
 */
export const cycleToVitals = (
  record: WhoopCycleRecord
): VitalsSummary | null => {
  const { cycle, recovery, sleeps } = record;
  const respiratoryRate = sleeps[0]?.respiratory_rate;
  const spo2Percent = recovery.spo2;
  const skinTempCelsius = recovery.skin_temp_celsius;
  const restingHeartRate = recovery.resting_heart_rate;

  const hasAny =
    respiratoryRate !== undefined ||
    spo2Percent !== undefined ||
    skinTempCelsius !== undefined ||
    restingHeartRate !== undefined;
  if (!hasAny) {
    return null;
  }

  return {
    kind: "vitals",
    version: KRD_VERSION,
    measuredAt: recovery.created_at,
    ...(respiratoryRate !== undefined ? { respiratoryRate } : {}),
    ...(spo2Percent !== undefined ? { spo2Percent } : {}),
    ...(skinTempCelsius !== undefined ? { skinTempCelsius } : {}),
    ...(restingHeartRate !== undefined ? { restingHeartRate } : {}),
    sourceBridgeId: SOURCE_BRIDGE_ID,
    externalId: `cycle:${cycle.id}:vitals`,
  };
};
