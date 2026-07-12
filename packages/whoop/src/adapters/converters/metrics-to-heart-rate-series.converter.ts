import type { HeartRateSeries } from "@kaiord/core";

import type { WhoopMetricsResponse } from "../schemas/whoop-metrics.schema";

const KRD_VERSION = "2.0" as const;
const SOURCE_BRIDGE_ID = "whoop-bridge";
const MIN_BPM = 0;
const MAX_BPM = 300;
const SECONDS_PER_DAY = 86_400;

const clampRoundBpm = (value: number): number =>
  Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));

/**
 * Buckets a WHOOP `metrics-service` heart_rate response into a per-day,
 * uniform-interval HR trace. WHOOP reports raw epoch-**millisecond** samples
 * roughly `stepSeconds` apart but with occasional gaps, so each sample is
 * slotted into `Math.round((time - first.time) / stepMs)` and any unset slot
 * between the first and last sample is filled with `null` — a fixed-cadence
 * array the caller can render or diff directly. `externalId` is keyed on
 * `(userId, date)` rather than a sample id so re-syncing the same day
 * upserts rather than duplicates. Returns `null` when there are no samples
 * to bucket.
 */
export const metricsToHeartRateSeries = (
  response: WhoopMetricsResponse,
  opts: { userId: number; date: string; stepSeconds: number }
): HeartRateSeries | null => {
  const samples = [...(response.values ?? [])].sort((a, b) => a.time - b.time);
  const [first] = samples;
  if (first == null) {
    return null;
  }

  const stepMs = opts.stepSeconds * 1000;
  // This is a per-day series, so cap the slot count at one day's worth of
  // slots. WHOOP `time` is unvalidated: without this bound a single outlier
  // sample would make `slot` enormous and force the gap-fill loop to
  // materialize a multi-million-element sparse array. Out-of-window samples
  // are dropped rather than allowed to blow up memory/time.
  const maxSlot = Math.ceil(SECONDS_PER_DAY / opts.stepSeconds);
  const bucketed: Array<number | null> = [];
  for (const sample of samples) {
    const slot = Math.round((sample.time - first.time) / stepMs);
    if (slot < 0 || slot > maxSlot) continue;
    bucketed[slot] = clampRoundBpm(sample.data);
  }
  for (let slot = 0; slot < bucketed.length; slot += 1) {
    if (bucketed[slot] === undefined) {
      bucketed[slot] = null;
    }
  }

  if (bucketed.every((value) => value === null)) {
    return null;
  }

  return {
    kind: "heart-rate-series",
    version: KRD_VERSION,
    startTime: new Date(first.time).toISOString(),
    intervalSeconds: opts.stepSeconds,
    samples: bucketed,
    sourceBridgeId: SOURCE_BRIDGE_ID,
    externalId: `hr:${opts.userId}:${opts.date}`,
  };
};
