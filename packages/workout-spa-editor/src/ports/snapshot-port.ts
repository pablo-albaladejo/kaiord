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

export type SnapshotPort = {
  /** Current Dexie schema version of the underlying database. */
  schemaVersion: () => Promise<number>;
  /** Dump every table's rows, keyed by table name. */
  exportTables: () => Promise<SnapshotTables>;
  /** Clear every table, then restore the provided rows. */
  importTables: (tables: SnapshotTables) => Promise<void>;
  /** Read every tombstone row. */
  listTombstones: () => Promise<Tombstone[]>;
  /** Clear the tombstones table, then write the provided tombstones. */
  replaceTombstones: (tombstones: ReadonlyArray<Tombstone>) => Promise<void>;
};
