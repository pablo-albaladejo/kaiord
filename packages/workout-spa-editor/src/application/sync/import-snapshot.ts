/**
 * importSnapshot use case
 *
 * Restores a `Snapshot` into the database through `SnapshotPort`,
 * replacing every table's rows and the tombstone set. Tombstones older
 * than the retention window are pruned on import. Pure: depends only on
 * the port, never on `dexie-database` (guard R-AppDexieImport).
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot } from "../../types/snapshot";
import { pruneTombstones } from "./prune-tombstones";

export type ImportSnapshotDeps = {
  port: SnapshotPort;
  snapshot: Snapshot;
  /** Injected clock for the tombstone retention prune (test-deterministic). */
  now?: () => Date;
};

export async function importSnapshot({
  port,
  snapshot,
  now = () => new Date(),
}: ImportSnapshotDeps): Promise<void> {
  const localVersion = await port.schemaVersion();
  if (snapshot.manifest.schemaVersion > localVersion) {
    throw new Error(
      `Snapshot schema v${snapshot.manifest.schemaVersion} is newer than this ` +
        `app's v${localVersion}; update the app before importing.`
    );
  }
  await port.importTables(snapshot.tables);
  await port.replaceTombstones(pruneTombstones(snapshot.tombstones, now()));
}
