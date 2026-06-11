import type { SleepRecord, SleepStage } from "@kaiord/core";

import type { FitSleepLevel } from "./fit-sleep-level.schema";

const HEALTH_VERSION = "2.0";
const TERMINATOR_LEVEL: SleepStage["stage"] = "awake";

const toIsoString = (value: FitSleepLevel["timestamp"]): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  return new Date(value).toISOString();
};

const isKnownSleepStage = (
  level: FitSleepLevel["sleepLevel"]
): level is SleepStage["stage"] =>
  level === "awake" || level === "light" || level === "deep" || level === "rem";

/**
 * Converts an ordered run of FIT `sleep_level` transitions into the KRD
 * sleep payload (sub-schema `extensions.health.sleep`).
 *
 * Convention: N transitions produce N-1 stages. The last transition
 * marks the endTime of the session; its sleepLevel is the terminator
 * (typically `awake`) and contributes no stage of its own.
 *
 * `unmeasurable` transitions are dropped from the stage stream — the
 * resulting stage span is widened to cover them — because KRD's
 * SleepStage enum does not model "unmeasurable" as a stage value.
 */
export const mapFitSleepLevelsToKrdSleep = (
  fitLevels: FitSleepLevel[]
): SleepRecord | undefined => {
  if (fitLevels.length < 2) return undefined;
  const sorted = [...fitLevels].sort(
    (a, b) =>
      new Date(toIsoString(a.timestamp)).getTime() -
      new Date(toIsoString(b.timestamp)).getTime()
  );
  const startTime = toIsoString(sorted[0]!.timestamp);
  const endTime = toIsoString(sorted[sorted.length - 1]!.timestamp);
  const stages: SleepStage[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i]!;
    if (!isKnownSleepStage(current.sleepLevel)) continue;
    const startMs = new Date(toIsoString(current.timestamp)).getTime();
    const nextMs = new Date(toIsoString(sorted[i + 1]!.timestamp)).getTime();
    const durationSeconds = Math.max(0, Math.round((nextMs - startMs) / 1000));
    stages.push({
      stage: current.sleepLevel,
      startTime: toIsoString(current.timestamp),
      durationSeconds,
    });
  }
  const totalDurationSeconds = stages.reduce(
    (sum, stage) => sum + stage.durationSeconds,
    0
  );
  return {
    kind: "sleep",
    version: HEALTH_VERSION,
    startTime,
    endTime,
    totalDurationSeconds,
    stages,
  };
};

/**
 * Inverse mapper — KRD sleep record → FIT `sleep_level` transitions.
 * Emits one transition per stage plus a terminator transition at
 * `endTime` to preserve the FIT semantics that the reader expects.
 */
export const mapKrdSleepToFitSleepLevels = (
  sleep: SleepRecord
): FitSleepLevel[] => {
  const transitions: FitSleepLevel[] = sleep.stages.map((stage) => ({
    timestamp: new Date(stage.startTime),
    sleepLevel: stage.stage,
  }));
  transitions.push({
    timestamp: new Date(sleep.endTime),
    sleepLevel: TERMINATOR_LEVEL,
  });
  return transitions;
};
