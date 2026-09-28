/**
 * Dexie implementation of ExportLedgerRepository.
 *
 * insertPending catches Dexie ConstraintError on the unique
 * [kaiordRecordId+destinationBridgeId] index and maps it to
 * { ok: false; reason: 'constraint' } so use cases never depend
 * on Dexie error types (R-AppDexieImport rule). `rollbackPending`
 * tombstones the row so the delete propagates through cloud sync.
 */
import type {
  ExportLedgerRepository,
  InsertPendingResult,
} from "../../application/export/export-ledger-repository.port";
import {
  type ExportLedgerEntry,
  resolveLedgerMutation,
} from "../../types/export-ledger";
import type { KaiordDatabase } from "./dexie-database";

// Narrow to a single explicit signature so tsc sidesteps Dexie's recursive
// transaction overloads (TS2589). Same pattern as dexie-snapshot-port.
type DexieTxScope = (
  mode: "rw",
  tables: ReadonlyArray<unknown>,
  scope: () => Promise<void>
) => Promise<void>;

type NaturalKey = { kaiordRecordId: string; destinationBridgeId: string };

const findByKey = async (
  db: KaiordDatabase,
  { kaiordRecordId, destinationBridgeId }: NaturalKey
) =>
  (await db
    .table("exportLedger")
    .where("[kaiordRecordId+destinationBridgeId]")
    .equals([kaiordRecordId, destinationBridgeId])
    .first()) as ExportLedgerEntry | undefined;

const tx = (db: KaiordDatabase) =>
  (db as unknown as { transaction: DexieTxScope }).transaction.bind(db);

export const createDexieExportLedgerRepository = (
  db: KaiordDatabase
): ExportLedgerRepository => ({
  findByNaturalKey: (key) => findByKey(db, key),

  insertPending: async (
    entry: ExportLedgerEntry
  ): Promise<InsertPendingResult> => {
    try {
      await db.table("exportLedger").add(entry);
      return { ok: true };
    } catch (e) {
      if ((e as { name?: string }).name === "ConstraintError") {
        return { ok: false, reason: "constraint" };
      }
      throw e;
    }
  },

  mutateByKey: async (key, fn) => {
    let after: ExportLedgerEntry | undefined;
    await tx(db)("rw", [db.table("exportLedger")], async () => {
      const current = await findByKey(db, key);
      const next = resolveLedgerMutation(current, fn, new Date().toISOString());
      // An id change is not a user delete: drop the old id untombstoned so the
      // put cannot hit the unique natural-key index. Other devices still
      // holding the old id converge through the natural-key fold on sync.
      if (current && next && next.id !== current.id)
        await db.table("exportLedger").delete(current.id);
      if (next) await db.table("exportLedger").put(next);
      after = next ?? current;
    });
    return after;
  },

  // Failed-POST rollback of this device's own pending row: tombstone it in
  // the same transaction, or a snapshot exported before the rollback would
  // resurrect it as a "pending" row that every device reads as a lost race.
  // A row that is gone or already committed (another device's POST landed on
  // the same id via sync) is left alone: deleting it would lose that id.
  // The cascade hook and orphan sweep delete without tombstoning on purpose
  // (reconciliation, not intent — see with-tombstones.ts).
  rollbackPending: async (id: string) => {
    const ledger = db.table("exportLedger");
    const tombstones = db.table("tombstones");
    await tx(db)("rw", [ledger, tombstones], async () => {
      const row = (await ledger.get(id)) as ExportLedgerEntry | undefined;
      if (row?.destinationExternalId !== "pending") return;
      await ledger.delete(id);
      const deletedAt = new Date().toISOString();
      await tombstones.put({ table: "exportLedger", id, deletedAt });
    });
  },

  countByDataType: async (dataType: string): Promise<number> =>
    db.table("exportLedger").where("dataType").equals(dataType).count(),
});
