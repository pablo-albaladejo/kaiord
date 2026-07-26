import type { SleepRecord } from "@kaiord/core";

import type { WhoopCycleSleep } from "../schemas/whoop-cycles.schema";
import { buildSleepStages } from "./sleep-stages.builder";

const KRD_VERSION = "2.0" as const;
const SOURCE_BRIDGE_ID = "whoop-bridge";
const MS_PER_S = 1000;
const DURING_RANGE = /'([^']+)'\s*,\s*'([^']+)'/;

/**
 * Parses a Postgres-range `during` string such as
 * `"['2026-07-09T22:24:47.970Z','2026-07-10T06:26:12.340Z')"` into its two
 * ISO endpoints.
 */
const parseDuringRange = (during: string): { start: string; end: string } => {
  const match = DURING_RANGE.exec(during);
  const start = match?.[1];
  const end = match?.[2];
  if (start === undefined || end === undefined) {
    throw new Error(`Unparseable WHOOP during range: ${during}`);
  }
  return { start, end };
};

/**
 * Maps a WHOOP cycle `sleeps[]` entry to `extensions.health.sleep`. WHOOP
 * durations are milliseconds (→ seconds). Stages are laid end-to-end from the
 * sleep start in light → deep → rem → awake order; `time_in_bed` includes
 * wake, so their sum matches `totalDurationSeconds` within tolerance.
 */
export const sleepsToSleep = (sleep: WhoopCycleSleep): SleepRecord => {
  const { start, end } = parseDuringRange(sleep.during);
  const stages = buildSleepStages(start, [
    { stage: "light", durationMs: sleep.light_sleep_duration },
    { stage: "deep", durationMs: sleep.slow_wave_sleep_duration },
    { stage: "rem", durationMs: sleep.rem_sleep_duration },
    { stage: "awake", durationMs: sleep.wake_duration },
  ]);

  return {
    kind: "sleep",
    version: KRD_VERSION,
    startTime: start,
    endTime: end,
    totalDurationSeconds: Math.round(sleep.time_in_bed / MS_PER_S),
    stages,
    sourceBridgeId: SOURCE_BRIDGE_ID,
    externalId: sleep.activity_id,
    ...(sleep.score !== undefined ? { score: Math.round(sleep.score) } : {}),
  };
};
