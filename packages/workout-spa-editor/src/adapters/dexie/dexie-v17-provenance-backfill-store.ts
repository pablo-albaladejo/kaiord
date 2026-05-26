/**
 * Per-store chunk iteration for the v17 provenance backfill.
 * Extracted from dexie-v17-provenance-backfill.ts to stay under line cap.
 */
import { deriveExternalId } from "@kaiord/core";
import type { Transaction } from "dexie";

import type {
  BackfillResult,
  OnQuotaError,
} from "./dexie-v17-provenance-backfill";

const CHUNK = 1_000;
const SOURCE_BRIDGE_ID = "manual";
const PROVENANCE_KEYS = new Set([
  "externalId",
  "sourceBridgeId",
  "kaiordRecordId",
]);

type HealthRow = Record<string, unknown> & {
  id: string;
  externalId?: string;
  measuredAt?: string;
  date?: string;
};

function stampRow(row: HealthRow): void {
  const measuredAt = (row.measuredAt ?? row.date ?? "") as string;
  const payload = Object.fromEntries(
    Object.entries(row).filter(([k]) => !PROVENANCE_KEYS.has(k))
  );
  row.sourceBridgeId = SOURCE_BRIDGE_ID;
  row.externalId = deriveExternalId({ payload, measuredAt });
  row.kaiordRecordId = crypto.randomUUID();
}

export async function backfillProvenanceStore(
  tx: Transaction,
  storeName: string,
  onQuotaError: OnQuotaError,
  result: BackfillResult
): Promise<void> {
  let offset = 0;
  for (;;) {
    const rows = (await tx
      .table(storeName)
      .offset(offset)
      .limit(CHUNK)
      .toArray()) as HealthRow[];
    if (rows.length === 0) break;
    const toUpdate: HealthRow[] = [];
    for (const row of rows) {
      if (row.externalId) {
        result.skipped++;
        continue;
      }
      stampRow(row);
      toUpdate.push(row);
      result.stamped++;
    }
    if (toUpdate.length > 0) {
      try {
        await tx.table(storeName).bulkPut(toUpdate);
      } catch (err) {
        if (err instanceof Error && err.name === "QuotaExceededError") {
          onQuotaError(err);
          return;
        }
        throw err;
      }
    }
    offset += rows.length;
    if (rows.length < CHUNK) break;
  }
}
