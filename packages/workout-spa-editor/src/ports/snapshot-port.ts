/**
 * Snapshot Port
 *
 * Whole-database dump/restore contract used by the `exportSnapshot` /
 * `importSnapshot` use cases. Exists separately from the per-domain
 * `PersistencePort` repositories because those expose only scoped
 * readers (no uniform `getAll`/`clear`), so a generic snapshot cannot be
 * assembled through `PersistencePort` alone. The Dexie adapter
 * implements this by enumerating `db.tables`; an in-memory fake mirrors
 * it for tests. Application use cases depend on this port and never
 * import `dexie-database` (guard R-AppDexieImport).
 */

import type { SnapshotTables, Tombstone } from "../types/snapshot";

/** Per-table live-row merge for `importTables`; `undefined` → replace. */
export type LiveRowMerge = (
  table: string
) =>
  | ((
      live: ReadonlyArray<unknown>,
      incoming: ReadonlyArray<unknown>
    ) => unknown[])
  | undefined;

export type SnapshotPort = {
  /**
   * Run `scope` inside a single database transaction spanning all
   * snapshot tables so a whole export (`"r"`) or import (`"rw"`) is
   * atomic and consistent: a concurrent write cannot interleave, and a
   * mid-restore failure rolls the database back. Inner port calls made
   * within `scope` join this transaction. The in-memory fake runs
   * `scope` directly (no real transactions to model).
   */
  transaction: <T>(mode: "r" | "rw", scope: () => Promise<T>) => Promise<T>;
  /** Current Dexie schema version of the underlying database. */
  schemaVersion: () => Promise<number>;
  /** Dump every table's rows, keyed by table name. */
  exportTables: () => Promise<SnapshotTables>;
  /**
   * Restore the provided rows. For each table the adapter asks
   * `options.liveMerge(table)`: when it returns a merge function, the adapter
   * reads the table's LIVE rows inside its read-write transaction and writes
   * `merge(live, incoming)` instead, so a write made after the snapshot was
   * exported is not wiped. Otherwise the table is cleared, then restored.
   */
  importTables: (
    tables: SnapshotTables,
    options: { liveMerge: LiveRowMerge }
  ) => Promise<void>;
  /** Read every tombstone row. */
  listTombstones: () => Promise<Tombstone[]>;
  /** Clear the tombstones table, then write the provided tombstones. */
  replaceTombstones: (tombstones: ReadonlyArray<Tombstone>) => Promise<void>;
};
