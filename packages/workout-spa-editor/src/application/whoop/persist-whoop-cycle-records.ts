/**
 * Persists parsed WHOOP cycle records as KRD health payloads, upserting
 * through the shared inbound natural-key path (`upsertImportedRecord`), the
 * same persistence the FIT and manual health-entry paths use. Each record is
 * stamped `sourceBridgeId: "whoop-bridge"` and deduped by `(sourceBridgeId,
 * externalId)`. Cycle → payload conversion lives in
 * whoop-cycle-to-pending-records.ts.
 */
import type { WhoopCycleRecord } from "@kaiord/whoop";

import type { ImportedRecordRepository } from "../import/imported-record-repository.port";
import { stampProvenance } from "../import/stamp-provenance";
import { upsertImportedRecord } from "../import/upsert-imported-record.use-case";
import {
  type PendingRecord,
  toPendingRecords,
} from "./whoop-cycle-to-pending-records";
import type { WhoopSyncFlags } from "./whoop-sync-flags";

export type { WhoopSyncFlags };

const WHOOP_BRIDGE_SOURCE = "whoop-bridge";
const datePart = (iso: string): string => iso.slice(0, 10);

export type WhoopPersistCounts = {
  hrvImported: number;
  sleepImported: number;
  strainImported: number;
  vitalsImported: number;
  skipped: number;
};

const bumpCount = (
  counts: WhoopPersistCounts,
  dataType: PendingRecord["dataType"]
): void => {
  if (dataType === "hrv") counts.hrvImported += 1;
  else if (dataType === "sleep") counts.sleepImported += 1;
  else if (dataType === "strain") counts.strainImported += 1;
  else counts.vitalsImported += 1;
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
    strainImported: 0,
    vitalsImported: 0,
    skipped: 0,
  };
  for (const record of records) {
    for (const pending of toPendingRecords(record, flags)) {
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
      else bumpCount(counts, pending.dataType);
    }
  }
  return counts;
};
