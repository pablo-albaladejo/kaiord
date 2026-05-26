/**
 * Export-ledger cascade + orphan sweep.
 *
 * `installExportLedgerCascade` wires Dexie 'deleting' hooks so that when
 * any health record or workout is deleted, matching exportLedger rows are
 * queued for removal. The hook returns a Promise so Dexie waits for the
 * cascade within the same transaction when the engine supports it.
 *
 * `sweepOrphanLedgerEntries` is the disaster-recovery path (new-machine
 * restore, etc.): scans every exportLedger row and deletes those whose
 * kaiordRecordId no longer resolves to a live record.
 */
import type { KaiordDatabase } from "./dexie-database";

const HEALTH_STORES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
] as const;

const SOURCE_STORES = [...HEALTH_STORES, "workouts"] as const;

type LedgerRow = { id: string; kaiordRecordId: string };

const deleteLedgerRows = (
  db: KaiordDatabase,
  kaiordRecordId: string
): Promise<number> =>
  db
    .table("exportLedger")
    .where("kaiordRecordId")
    .equals(kaiordRecordId)
    .delete();

export function installExportLedgerCascade(db: KaiordDatabase): void {
  const tableNames = new Set(db.tables.map((t) => t.name));
  if (!tableNames.has("exportLedger")) return;
  for (const storeName of SOURCE_STORES) {
    if (!tableNames.has(storeName)) continue;
    db.table(storeName).hook(
      "deleting",
      (_primKey, obj: Record<string, unknown>) => {
        const id = obj["kaiordRecordId"] as string | undefined;
        if (!id) return undefined;
        return deleteLedgerRows(db, id).then(() => undefined);
      }
    );
  }
}

export async function sweepOrphanLedgerEntries(
  db: KaiordDatabase
): Promise<{ removed: number }> {
  const entries = (await db.table("exportLedger").toArray()) as LedgerRow[];
  const tableNames = new Set(db.tables.map((t) => t.name));
  const available = SOURCE_STORES.filter((s) => tableNames.has(s));
  let removed = 0;

  for (const entry of entries) {
    let found = false;
    for (const storeName of available) {
      if ((await db.table(storeName).get(entry.kaiordRecordId)) !== undefined) {
        found = true;
        break;
      }
    }
    if (!found) {
      await db.table("exportLedger").delete(entry.id);
      removed++;
    }
  }

  return { removed };
}
