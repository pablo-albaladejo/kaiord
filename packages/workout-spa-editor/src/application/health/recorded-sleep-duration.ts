import type { SleepRecord } from "@kaiord/core";

/**
 * The night's recorded duration in seconds, or `undefined` when none was
 * recorded: an absent `totalDurationSeconds`, or the `0` that hand-entered
 * scores were once stored with. A zero-length night is never a real one.
 */
export const recordedSleepSeconds = (
  krd: Pick<SleepRecord, "totalDurationSeconds">
): number | undefined => {
  const total = krd.totalDurationSeconds;
  return total !== undefined && total > 0 ? total : undefined;
};
