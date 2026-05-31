/**
 * Cross-device Snapshot Types
 *
 * Domain types for the whole-database snapshot exchanged with cloud
 * storage (Google Drive `appDataFolder`). A snapshot is a manifest plus
 * a generic per-table row map and a tombstone list. These types carry no
 * I/O or merge logic — they are pure data shapes shared by the snapshot
 * use cases, the cloud-sync port, and the Dexie `SnapshotPort` adapter.
 */

/** A single deleted-record marker propagated across devices. */
export type Tombstone = {
  table: string;
  id: string;
  /** ISO 8601 timestamp of the delete. */
  deletedAt: string;
  /** Present only for profile-scoped rows. */
  profileId?: string;
};

/** Cleartext metadata that travels with every snapshot, encrypted or not. */
export type SnapshotManifest = {
  /** Dexie schema version the snapshot was exported at. */
  schemaVersion: number;
  /** Stable per-device identifier (uuid). */
  deviceId: string;
  /** ISO 8601 export timestamp; comparison clock for timestampless tables. */
  exportedAt: string;
  /** True when `tables`/`tombstones` are replaced by `ciphertext`. */
  encrypted: boolean;
};

/** Generic per-table row map: table name → array of row objects. */
export type SnapshotTables = Record<string, ReadonlyArray<unknown>>;

/** A full, in-memory database snapshot ready to merge or import. */
export type Snapshot = {
  manifest: SnapshotManifest;
  tables: SnapshotTables;
  tombstones: ReadonlyArray<Tombstone>;
};

/** A snapshot fetched from cloud storage paired with its revision id. */
export type RemoteSnapshot = {
  snapshot: Snapshot;
  /** Drive `headRevisionId` for optimistic-concurrency push. */
  headRevisionId: string;
};
