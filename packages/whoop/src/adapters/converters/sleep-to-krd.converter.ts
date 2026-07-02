import type { KRD, SleepRecord } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import type { WhoopSleepRecord } from "../schemas/whoop-sleep.schema";
import { buildSleepStages } from "./sleep-stages.builder";
import { buildWhoopHealthMetadata } from "./whoop-health-metadata.builder";

const KRD_VERSION = "2.0" as const;
const SCORED = "SCORED";

export type WhoopSleepMapOptions = {
  /**
   * Resting heart rate (bpm) for this sleep, joined by the service from the
   * matching WHOOP recovery record (`recovery.score.resting_heart_rate`).
   * WHOOP's sleep payload itself carries no RHR.
   */
  restingHeartRate?: number;
};

/**
 * Maps a WHOOP sleep activity to a KRD `sleep_record`. Stages are
 * synthesised from WHOOP's aggregate durations (see `buildSleepStages`);
 * `sleep_performance_percentage` → `score`. Returns `undefined` when the
 * sleep is unscored (no `stage_summary` to derive stages from).
 */
export const mapWhoopSleepToKrd = (
  sleep: WhoopSleepRecord,
  options: WhoopSleepMapOptions = {}
): KRD | undefined => {
  const score = sleep.score;
  if (sleep.score_state !== SCORED || !score) return undefined;

  const { stages, totalDurationSeconds } = buildSleepStages(
    sleep.start,
    score.stage_summary
  );

  const record: SleepRecord = {
    kind: "sleep",
    version: KRD_VERSION,
    startTime: sleep.start,
    endTime: sleep.end,
    totalDurationSeconds,
    stages,
    externalId: sleep.id,
    ...(score.sleep_performance_percentage !== undefined
      ? { score: Math.round(score.sleep_performance_percentage) }
      : {}),
    ...(options.restingHeartRate !== undefined
      ? { restingHeartRate: Math.round(options.restingHeartRate) }
      : {}),
  };

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.sleep_record,
    metadata: buildWhoopHealthMetadata(sleep.start),
    extensions: { health: { sleep: record } },
  };
};
