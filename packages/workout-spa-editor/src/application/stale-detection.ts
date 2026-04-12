/**
 * Stale Detection
 *
 * Detects when a workout's raw content has changed and
 * transitions to stale when user work would be affected.
 */

import { computeRawHash } from "../lib/raw-hash";
import type { WorkoutRaw } from "../types/calendar-fragments";
import type { WorkoutRecord } from "../types/calendar-record";

export const detectStale = async (
  existing: WorkoutRecord,
  newRaw: WorkoutRaw
): Promise<WorkoutRecord> => {
  const newHash = await computeRawHash(newRaw);

  if (existing.raw?.rawHash === newHash) {
    return existing;
  }

  const updatedRaw = { ...newRaw, rawHash: newHash };
  const updatedAt = new Date().toISOString();

  if (existing.state === "skipped") {
    return existing;
  }

  if (existing.state === "raw") {
    return { ...existing, raw: updatedRaw, updatedAt };
  }

  return {
    ...existing,
    state: "stale",
    previousState: existing.state,
    raw: updatedRaw,
    lastProcessingError: null,
    updatedAt,
  };
};
