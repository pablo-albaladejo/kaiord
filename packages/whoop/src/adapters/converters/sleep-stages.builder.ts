import type { SleepStage } from "@kaiord/core";

import type { WhoopSleepStageSummary } from "../schemas/whoop-sleep.schema";

const MS_PER_S = 1000;

type StageSpec = { stage: SleepStage["stage"]; milli: number };

/**
 * Synthesises non-overlapping, time-ordered KRD sleep stages from WHOOP's
 * aggregate stage totals. WHOOP does not expose a per-sample timeline, so
 * the buckets are laid out sequentially from `startIso` in canonical order
 * (awake → light → deep → rem). WHOOP "slow wave" maps to KRD `deep`.
 *
 * Zero-duration buckets are dropped. The returned stages' durations sum to
 * the classified in-bed total (WHOOP `no_data` time has no KRD stage and is
 * excluded), so the caller SHALL set `totalDurationSeconds` to that sum to
 * satisfy the sleep-record ±60 s invariant.
 */
export const buildSleepStages = (
  startIso: string,
  summary: WhoopSleepStageSummary
): { stages: SleepStage[]; totalDurationSeconds: number } => {
  const specs: StageSpec[] = [
    { stage: "awake", milli: summary.total_awake_time_milli },
    { stage: "light", milli: summary.total_light_sleep_time_milli },
    { stage: "deep", milli: summary.total_slow_wave_sleep_time_milli },
    { stage: "rem", milli: summary.total_rem_sleep_time_milli },
  ];

  const startMs = new Date(startIso).getTime();
  let offsetSeconds = 0;
  const stages: SleepStage[] = [];
  for (const spec of specs) {
    const durationSeconds = Math.round(spec.milli / MS_PER_S);
    if (durationSeconds <= 0) continue;
    stages.push({
      stage: spec.stage,
      startTime: new Date(startMs + offsetSeconds * MS_PER_S).toISOString(),
      durationSeconds,
    });
    offsetSeconds += durationSeconds;
  }

  return { stages, totalDurationSeconds: offsetSeconds };
};
