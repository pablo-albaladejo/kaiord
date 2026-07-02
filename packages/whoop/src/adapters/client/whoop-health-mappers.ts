import type { KRD } from "@kaiord/core";

import { mapWhoopRecoveryToKrd } from "../converters/recovery-to-krd.converter";
import { mapWhoopSleepToKrd } from "../converters/sleep-to-krd.converter";
import type { WhoopRecoveryRecord } from "../schemas/whoop-recovery.schema";
import type { WhoopSleepRecord } from "../schemas/whoop-sleep.schema";

const defined = (krd: KRD | undefined): krd is KRD => krd !== undefined;

/** Maps WHOOP recovery records to `hrv_summary` KRDs, dropping unscored ones. */
export const recoveriesToKrds = (records: WhoopRecoveryRecord[]): KRD[] =>
  records.map((record) => mapWhoopRecoveryToKrd(record)).filter(defined);

/**
 * Maps WHOOP sleep activities to `sleep_record` KRDs, grafting resting heart
 * rate from `rhrBySleepId` (built from the matching recovery records).
 */
export const sleepsToKrds = (
  records: WhoopSleepRecord[],
  rhrBySleepId?: Map<string, number>
): KRD[] =>
  records
    .map((record) =>
      mapWhoopSleepToKrd(record, {
        restingHeartRate: rhrBySleepId?.get(record.id),
      })
    )
    .filter(defined);
