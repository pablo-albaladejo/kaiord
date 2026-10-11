/**
 * Builds the KRD sleep record for a hand-entered night.
 *
 * The duration comes from the hours slept, or from bedtime → wake time
 * when only the clock times are given. A score alone stores no duration:
 * `totalDurationSeconds` is left out rather than written as `0`. Without
 * clock times the window is anchored at noon UTC of `day`, like the other
 * manual metrics. Stages are never invented (`stages: []`).
 */
import {
  SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS,
  type SleepRecord,
} from "@kaiord/core";

const KRD_VERSION = "2.0";
const MS_PER_SECOND = 1000;

export type ManualSleepEntry = {
  durationSeconds?: number;
  score?: number;
  /** Bedtime, ISO datetime. */
  startTime?: string;
  /** Wake time, ISO datetime. */
  endTime?: string;
};

const toMs = (iso: string): number => new Date(iso).getTime();
const toIso = (ms: number): string => new Date(ms).toISOString();

const clockSpanSeconds = (entry: ManualSleepEntry): number | undefined =>
  entry.startTime && entry.endTime
    ? (toMs(entry.endTime) - toMs(entry.startTime)) / MS_PER_SECOND
    : undefined;

/**
 * The night's duration in seconds; `undefined` when none was given, `null`
 * when it is not positive or the hours disagree with bedtime → wake time.
 */
export const resolveSleepDuration = (
  entry: ManualSleepEntry
): number | undefined | null => {
  const span = clockSpanSeconds(entry);
  const duration = entry.durationSeconds ?? span;
  if (duration === undefined) return undefined;
  if (!Number.isFinite(duration) || duration <= 0) return null;
  const mismatch =
    entry.durationSeconds !== undefined &&
    span !== undefined &&
    Math.abs(span - entry.durationSeconds) >
      SLEEP_TOTAL_DURATION_TOLERANCE_SECONDS;
  return mismatch ? null : Math.round(duration);
};

const resolveWindow = (
  entry: ManualSleepEntry,
  day: string,
  durationSeconds: number
): { startTime: string; endTime: string } => {
  const durationMs = durationSeconds * MS_PER_SECOND;
  if (entry.endTime) {
    const end = toMs(entry.endTime);
    return {
      startTime: toIso(
        entry.startTime ? toMs(entry.startTime) : end - durationMs
      ),
      endTime: toIso(end),
    };
  }
  const start = toMs(entry.startTime ?? `${day}T12:00:00.000Z`);
  return { startTime: toIso(start), endTime: toIso(start + durationMs) };
};

/** `undefined` when the entry carries nothing storable or is inconsistent. */
export const buildSleepPayload = (
  entry: ManualSleepEntry,
  day: string
): SleepRecord | undefined => {
  const duration = resolveSleepDuration(entry);
  if (duration === null) return undefined;
  if (duration === undefined && entry.score === undefined) return undefined;
  return {
    kind: "sleep",
    version: KRD_VERSION,
    ...resolveWindow(entry, day, duration ?? 0),
    ...(duration !== undefined ? { totalDurationSeconds: duration } : {}),
    stages: [],
    ...(entry.score !== undefined ? { score: entry.score } : {}),
  };
};
