/**
 * importSnapshot use case
 *
 * Restores a `Snapshot` into the database through `SnapshotPort`,
 * replacing every table's rows and the tombstone set. Pure: depends only
 * on the port, never on `dexie-database` (guard R-AppDexieImport).
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { Snapshot } from "../../types/snapshot";

export type ImportSnapshotDeps = {
  port: SnapshotPort;
  snapshot: Snapshot;
};

export async function importSnapshot({
  port,
  snapshot,
}: ImportSnapshotDeps): Promise<void> {
  await port.importTables(snapshot.tables);
  await port.replaceTombstones(snapshot.tombstones);
}
