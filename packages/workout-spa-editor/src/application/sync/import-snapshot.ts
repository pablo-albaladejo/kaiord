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
  await port.importTables(snapshot.tables);
  await port.replaceTombstones(pruneTombstones(snapshot.tombstones, now()));
}
