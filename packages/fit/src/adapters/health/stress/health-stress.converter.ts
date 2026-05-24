import type { StressEpisode } from "@kaiord/core";

import type { FitStressLevel } from "./fit-stress.schema";

const HEALTH_VERSION = "2.0";
const MIN_VALID = 0;
const MAX_VALID = 100;
const MS_PER_S = 1000;

const toEpochMs = (value: FitStressLevel["stressLevelTime"]): number => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value * MS_PER_S;
  return new Date(value).getTime();
};

const isValid = (sample: FitStressLevel): boolean =>
  sample.stressLevelValue >= MIN_VALID && sample.stressLevelValue <= MAX_VALID;

const mean = (values: number[]): number =>
  Math.round(values.reduce((s, v) => s + v, 0) / values.length);

/**
 * Aggregates a list of FIT `stress_level` samples into the KRD
 * `extensions.health.stress` episode payload. Garmin emits negative
 * sentinels (-1 / -2) when stress can't be measured; those samples
 * are discarded before aggregation. Returns `undefined` if no valid
 * sample remains.
 */
export const mapFitStressToKrd = (
  samples: FitStressLevel[]
): StressEpisode | undefined => {
  const valid = samples.filter(isValid);
  if (valid.length === 0) return undefined;
  const epochs = valid.map((s) => toEpochMs(s.stressLevelTime));
  const values = valid.map((s) => s.stressLevelValue);
  return {
    kind: "stress",
    version: HEALTH_VERSION,
    startTime: new Date(Math.min(...epochs)).toISOString(),
    endTime: new Date(Math.max(...epochs)).toISOString(),
    averageLevel: mean(values),
    peakLevel: Math.max(...values),
  };
};

/**
 * Inverse mapper — KRD stress episode → minimum-viable FIT
 * `stress_level` pair (one sample at `startTime` with `averageLevel`,
 * one at `endTime` with `peakLevel`). Per-sample data is intrinsically
 * lossy round-tripping a KRD aggregate; the FIT→KRD path will
 * recover startTime, endTime, and peakLevel exactly, but averageLevel
 * becomes `round((average + peak) / 2)`.
 */
export const mapKrdStressToFit = (episode: StressEpisode): FitStressLevel[] => [
  {
    stressLevelTime: new Date(episode.startTime),
    stressLevelValue: episode.averageLevel,
  },
  {
    stressLevelTime: new Date(episode.endTime),
    stressLevelValue: episode.peakLevel,
  },
];
