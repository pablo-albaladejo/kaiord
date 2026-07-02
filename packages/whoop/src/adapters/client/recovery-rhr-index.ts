import type { WhoopRecoveryRecord } from "../schemas/whoop-recovery.schema";

/**
 * Indexes resting heart rate by `sleep_id` from WHOOP recovery records so the
 * service can graft `recovery.score.resting_heart_rate` onto the matching
 * `sleep_record` (WHOOP's sleep payload carries no RHR of its own).
 */
export const buildRecoveryRhrIndex = (
  recoveries: WhoopRecoveryRecord[]
): Map<string, number> => {
  const index = new Map<string, number>();
  for (const recovery of recoveries) {
    const rhr = recovery.score?.resting_heart_rate;
    if (recovery.sleep_id && typeof rhr === "number" && rhr > 0) {
      index.set(recovery.sleep_id, rhr);
    }
  }
  return index;
};
