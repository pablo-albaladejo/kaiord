import type { SleepStage } from "@kaiord/core";

const MS_PER_S = 1000;

export type StageDuration = {
  stage: SleepStage["stage"];
  durationMs: number;
};

/**
 * Lays the supplied WHOOP stage durations end-to-end starting at `startIso`,
 * in the order given. WHOOP exposes aggregate durations, not a per-sample
 * timeline, so stages are synthesised sequentially. Durations are converted
 * from milliseconds to whole seconds; a zero-length stage is skipped.
 */
export const buildSleepStages = (
  startIso: string,
  specs: StageDuration[]
): SleepStage[] => {
  const startMs = new Date(startIso).getTime();
  let offsetSeconds = 0;
  const stages: SleepStage[] = [];
  for (const spec of specs) {
    const durationSeconds = Math.round(spec.durationMs / MS_PER_S);
    if (durationSeconds <= 0) continue;
    stages.push({
      stage: spec.stage,
      startTime: new Date(startMs + offsetSeconds * MS_PER_S).toISOString(),
      durationSeconds,
    });
    offsetSeconds += durationSeconds;
  }
  return stages;
};
