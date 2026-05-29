/**
 * Dexie implementation of ExportLedgerRepository.
 *
 * insertPending catches Dexie ConstraintError on the unique
 * [kaiordRecordId+destinationBridgeId] index and maps it to
 * { ok: false; reason: 'constraint' } so use cases never depend
 * on Dexie error types (R-AppDexieImport rule).
 */
import type {
  ExportLedgerRepository,
  InsertPendingResult,
} from "../../application/export/export-ledger-repository.port";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { KaiordDatabase } from "./dexie-database";

export const createDexieExportLedgerRepository = (
  db: KaiordDatabase
): ExportLedgerRepository => ({
  findByNaturalKey: async ({ kaiordRecordId, destinationBridgeId }) =>
    (await db
      .table("exportLedger")
      .where("[kaiordRecordId+destinationBridgeId]")
      .equals([kaiordRecordId, destinationBridgeId])
      .first()) as ExportLedgerEntry | undefined,

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

  update: async (id: string, patch: Partial<ExportLedgerEntry>) => {
    await db.table("exportLedger").update(id, patch);
  },

  deleteById: async (id: string) => {
    await db.table("exportLedger").delete(id);
  },
});
