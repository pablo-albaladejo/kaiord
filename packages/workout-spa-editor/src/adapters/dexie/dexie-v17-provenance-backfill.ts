/**
 * v17 provenance backfill — stamps sourceBridgeId + externalId on legacy
 * health rows that pre-date the provenance schema.
 *
 * Iterates all six health stores in 1 000-row chunks. Rows without
 * `externalId` are manual entries by definition and receive:
 *   - sourceBridgeId = 'manual'
 *   - externalId = deriveExternalId({ payload, measuredAt })
 *   - kaiordRecordId = crypto.randomUUID()
 *
 * `QuotaExceededError` is surfaced to the injected `onQuotaError` callback
 * (default: console.warn) and does NOT throw — partial backfill is
 * acceptable because the upgrade is idempotent on retry.
 */
import type { Transaction } from "dexie";

import { backfillProvenanceStore } from "./dexie-v17-provenance-backfill-store";

export type OnQuotaError = (err: unknown) => void;
export type BackfillResult = { stamped: number; skipped: number };

const HEALTH_STORES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
] as const;

export async function backfillHealthProvenance(
  tx: Transaction,
  onQuotaError: OnQuotaError = (err) =>
    console.warn("[v17 backfill] QuotaExceededError:", err)
): Promise<BackfillResult> {
  const result: BackfillResult = { stamped: 0, skipped: 0 };
  for (const storeName of HEALTH_STORES) {
    try {
      await backfillProvenanceStore(tx, storeName, onQuotaError, result);
    } catch (err) {
      // Skip stores not opened in this transaction (unit-test isolation).
      if (err instanceof Error && err.name === "NotFoundError") continue;
      throw err;
    }
  }
  return result;
}
