/**
 * Converts parsed WHOOP cycle records into KRD health payloads and upserts
 * them through the shared inbound natural-key path (`upsertImportedRecord`),
 * the same persistence the FIT and manual health-entry paths use. Each record
 * is stamped `sourceBridgeId: "whoop-bridge"` and deduped by
 * `(sourceBridgeId, externalId)` — the converters already set `externalId`.
 */
import type { WhoopCycleRecord } from "@kaiord/whoop";
import { recoveryToHrv, sleepsToSleep } from "@kaiord/whoop";

import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import { stampProvenance } from "../import/stamp-provenance";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";

const WHOOP_BRIDGE_SOURCE = "whoop-bridge";
const datePart = (iso: string): string => iso.slice(0, 10);

export type WhoopSyncFlags = { hrv: boolean; sleep: boolean };

export type WhoopPersistCounts = {
  hrvImported: number;
  sleepImported: number;
  skipped: number;
};

type PendingRecord = {
  dataType: "hrv" | "sleep";
  measuredAt: string;
  externalId: string;
  payload: Record<string, unknown>;
};

const toPending = (
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
  return pending;
};

export const persistWhoopCycleRecords = async (
  recordRepo: ImportedRecordRepository,
  profileId: string,
  records: readonly WhoopCycleRecord[],
  flags: WhoopSyncFlags
): Promise<WhoopPersistCounts> => {
  const counts: WhoopPersistCounts = {
    hrvImported: 0,
    sleepImported: 0,
    skipped: 0,
  };
  for (const record of records) {
    for (const pending of toPending(record, flags)) {
      const { created } = await upsertImportedRecord(
        { recordRepo },
        {
          profileId,
          dataType: pending.dataType,
          date: datePart(pending.measuredAt),
          payload: pending.payload,
          measuredAt: pending.measuredAt,
          ...stampProvenance(WHOOP_BRIDGE_SOURCE, pending.externalId),
        }
      );
      if (!created) counts.skipped += 1;
      else if (pending.dataType === "hrv") counts.hrvImported += 1;
      else counts.sleepImported += 1;
    }
  }
  return counts;
};
