/**
 * importSnapshot use case
 *
 * Restores a `Snapshot` into the database through `SnapshotPort`,
 * replacing every table's rows (natural-key tables merge with the live rows
 * instead, and given the caller's `exported` rows every other table keeps
 * the live rows written since — see `createLiveRowMerge`) and setting the tombstones to
 * the snapshot's unioned with the live ones. Tombstones older
 * than the retention window are pruned on import. Pure: depends only on
 * the port, never on `dexie-database` (guard R-AppDexieImport).
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot, SnapshotTables, Tombstone } from "../../types/snapshot";
import { createLiveRowMerge } from "./merge-table-rows";
import { unionTombstones } from "./merge-tombstones";
import { pruneTombstones } from "./prune-tombstones";
import { suppressLiveDeletes } from "./suppress-live-deletes";

export type ImportSnapshotDeps = {
  port: SnapshotPort;
  snapshot: Snapshot;
  /**
   * The rows this import's caller exported before merging, read in an
   * earlier transaction: live rows that changed since are kept, not wiped.
   */
  exported?: SnapshotTables;
  /** Injected clock for the tombstone retention prune (test-deterministic). */
  now?: () => Date;
};

export async function importSnapshot({
  port,
  snapshot,
  exported,
  now = () => new Date(),
}: ImportSnapshotDeps): Promise<ReadonlyArray<Tombstone>> {
  const localVersion = await port.schemaVersion();
  if (snapshot.manifest.schemaVersion > localVersion) {
    throw new Error(
      `Snapshot schema v${snapshot.manifest.schemaVersion} is newer than this ` +
        `app's v${localVersion}; update the app before importing.`
    );
  }
  // Single read-write transaction so tables and tombstones are restored
  // atomically: a failure mid-restore rolls the whole database back rather
  // than leaving tables replaced but tombstones stale (or vice versa).
  let live: ReadonlyArray<Tombstone> = [];
  await port.transaction("rw", async () => {
    // Union with the LIVE tombstones read inside this transaction: a delete
    // made after the snapshot was exported must neither be wiped from the
    // tombstone set nor let its row come back from the snapshot.
    live = await port.listTombstones();
    const tombstones = pruneTombstones(
      unionTombstones(snapshot.tombstones, live),
      now()
    );
    const liveMerge = createLiveRowMerge(tombstones, exported);
    // A profile deleted since the export took its rows without tombstones.
    const { tables } = suppressLiveDeletes(
      snapshot,
      live,
      port.perProfileTables()
    );
    await port.importTables(tables, { liveMerge });
    await port.replaceTombstones(tombstones);
  });
  // The caller pushes `snapshot`; these let it carry a delete made meanwhile.
  return live;
}
