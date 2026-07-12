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

const mapHrv = (record: WhoopCycleRecord): PendingRecord => {
  const hrv = recoveryToHrv(record.recovery, record.cycle);
  return {
    dataType: "hrv",
    measuredAt: hrv.measuredAt,
    externalId: hrv.externalId ?? `cycle:${record.cycle.id}:hrv`,
    payload: hrv,
  };
};

const mapSleeps = (record: WhoopCycleRecord): PendingRecord[] =>
  record.sleeps.map((sleep) => {
    const mapped = sleepsToSleep(sleep);
    return {
      dataType: "sleep",
      measuredAt: mapped.startTime,
      externalId: mapped.externalId ?? sleep.activity_id,
      payload: mapped,
    };
  });

const mapStrain = (record: WhoopCycleRecord): PendingRecord | null => {
  const strain = cycleToStrain(record);
  if (!strain) return null;
  return {
    dataType: "strain",
    measuredAt: `${strain.date}T00:00:00.000Z`,
    externalId: strain.externalId ?? `cycle:${record.cycle.id}:strain`,
    payload: strain,
  };
};

const mapVitals = (record: WhoopCycleRecord): PendingRecord | null => {
  const vitals = cycleToVitals(record);
  if (!vitals) return null;
  return {
    dataType: "vitals",
    measuredAt: vitals.measuredAt,
    externalId: vitals.externalId ?? `cycle:${record.cycle.id}:vitals`,
    payload: vitals,
  };
};

export const toPendingRecords = (
  record: WhoopCycleRecord,
  flags: WhoopSyncFlags
): PendingRecord[] => {
  const pending: PendingRecord[] = [];
  if (flags.hrv) pending.push(mapHrv(record));
  if (flags.sleep) pending.push(...mapSleeps(record));
  if (flags.strain) {
    const strain = mapStrain(record);
    if (strain) pending.push(strain);
  }
  if (flags.vitals) {
    const vitals = mapVitals(record);
    if (vitals) pending.push(vitals);
  }
  return pending;
};
