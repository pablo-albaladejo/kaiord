/**
 * Converts one WHOOP cycle record into the KRD health payloads its enabled
 * sync flags request. Pure mapping — persistence (upsert, counting) lives in
 * persist-whoop-cycle-records.ts. `cycleToStrain`/`cycleToVitals` report
 * "nothing to convert" as `null` (e.g. an in-progress cycle, or a cycle with
 * none of the four vitals fields), so those are skipped rather than pushed
 * as an empty placeholder record.
 */
import type { WhoopCycleRecord } from "@kaiord/whoop";
import {
  cycleToStrain,
  cycleToVitals,
  recoveryToHrv,
  sleepsToSleep,
} from "@kaiord/whoop";

import type { WhoopSyncFlags } from "./whoop-sync-flags";

export type PendingRecord = {
  dataType: "hrv" | "sleep" | "strain" | "vitals";
  measuredAt: string;
  externalId: string;
  payload: Record<string, unknown>;
};

export const toPendingRecords = (
  record: WhoopCycleRecord,
  flags: WhoopSyncFlags
): PendingRecord[] => {
  const pending: PendingRecord[] = [];
  if (flags.hrv) {
    const hrv = recoveryToHrv(record.recovery, record.cycle);
    pending.push({
      dataType: "hrv",
      measuredAt: hrv.measuredAt,
      externalId: hrv.externalId ?? `cycle:${record.cycle.id}:hrv`,
      payload: hrv,
    });
  }
  if (flags.sleep) {
    for (const sleep of record.sleeps) {
      const mapped = sleepsToSleep(sleep);
      pending.push({
        dataType: "sleep",
        measuredAt: mapped.startTime,
        externalId: mapped.externalId ?? sleep.activity_id,
        payload: mapped,
      });
    }
  }
  if (flags.strain) {
    const strain = cycleToStrain(record);
    if (strain) {
      pending.push({
        dataType: "strain",
        measuredAt: `${strain.date}T00:00:00.000Z`,
        externalId: strain.externalId ?? `cycle:${record.cycle.id}:strain`,
        payload: strain,
      });
    }
  }
  if (flags.vitals) {
    const vitals = cycleToVitals(record);
    if (vitals) {
      pending.push({
        dataType: "vitals",
        measuredAt: vitals.measuredAt,
        externalId: vitals.externalId ?? `cycle:${record.cycle.id}:vitals`,
        payload: vitals,
      });
    }
  }
  return pending;
};
