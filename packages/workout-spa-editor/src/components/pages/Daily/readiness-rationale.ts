import type { HrvSummary, SleepRecord } from "@kaiord/core";

import { MANUAL_SOURCE_ID } from "../../../application/connections/data-type-sources";
import type { Translate } from "../../../i18n/use-translate";

/**
 * Names only the inputs the composite score was actually built from, and
 * says so when the sleep score is one the user typed in rather than a
 * device's reading.
 */
export function readinessRationale(
  hrv: HrvSummary | undefined,
  sleep: SleepRecord | undefined,
  sleepSourceBridgeId: string | undefined,
  t: Translate
): string {
  const hrvScored = typeof hrv?.score === "number";
  const sleepScored = typeof sleep?.score === "number";
  const sleepManual = sleepSourceBridgeId === MANUAL_SOURCE_ID;
  if (!sleepScored)
    return t(
      hrvScored ? "readiness.rationaleHrv" : "readiness.rationaleNoData"
    );
  if (!hrvScored)
    return t(
      sleepManual
        ? "readiness.rationaleSleepManual"
        : "readiness.rationaleSleep"
    );
  return t(
    sleepManual ? "readiness.rationaleHrvSleepManual" : "readiness.rationale"
  );
}
