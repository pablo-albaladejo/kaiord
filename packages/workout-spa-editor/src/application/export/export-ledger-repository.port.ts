/**
 * Port — ExportLedgerRepository
 *
 * Abstract contract for the exportLedger Dexie store.
 * insertPending maps Dexie ConstraintError to a typed result so use
 * cases never import Dexie error types (R-AppDexieImport rule).
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";

export type InsertPendingResult =
  | { ok: true }
  | { ok: false; reason: "constraint" };

export type ExportLedgerRepository = {
  findByNaturalKey: (input: {
    kaiordRecordId: string;
    destinationBridgeId: string;
  }) => Promise<ExportLedgerEntry | undefined>;
  insertPending: (entry: ExportLedgerEntry) => Promise<InsertPendingResult>;
  update: (id: string, patch: Partial<ExportLedgerEntry>) => Promise<void>;
  deleteById: (id: string) => Promise<void>;
  countByDataType: (dataType: string) => Promise<number>;
};
