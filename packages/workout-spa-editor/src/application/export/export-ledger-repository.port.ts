/**
 * Port — ExportLedgerRepository
 *
 * Abstract contract for the exportLedger Dexie store.
 * insertPending maps Dexie ConstraintError to a typed result so use
 * cases never import Dexie error types (R-AppDexieImport rule).
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";

export type InsertPendingResult =
  { ok: true } | { ok: false; reason: "constraint" };

export type ExportLedgerRepository = {
  findByNaturalKey: (input: {
    kaiordRecordId: string;
    destinationBridgeId: string;
  }) => Promise<ExportLedgerEntry | undefined>;
  insertPending: (entry: ExportLedgerEntry) => Promise<InsertPendingResult>;
  /**
   * Read-modify-write of the row holding `key`, in its own read-write
   * transaction that re-reads the row by natural key (never by ledger id —
   * after a cloud-sync dedupe the surviving row may carry another device's
   * id). No owner, no compare-and-swap. `fn` receives `undefined` when the
   * row is absent and returns the row to store, or `undefined` to write
   * nothing. `updatedAt` is stamped only when `fn` actually changed the row
   * (deep-equal); a no-op leaves it byte-identical. Resolves to the row held
   * afterwards.
   */
  mutateByKey: (
    key: { kaiordRecordId: string; destinationBridgeId: string },
    fn: (row: ExportLedgerEntry | undefined) => ExportLedgerEntry | undefined
  ) => Promise<ExportLedgerEntry | undefined>;
  deleteById: (id: string) => Promise<void>;
  countByDataType: (dataType: string) => Promise<number>;
};
