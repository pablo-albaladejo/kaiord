/**
 * Applies to a merged snapshot the live tombstones its import read. A row
 * deleted on this device between the sync's export read and its import is
 * still in the merged snapshot; pushed as is, it would reach the remote
 * without its tombstone until the next sync. When no live tombstone is new
 * to the snapshot, the snapshot is returned untouched. Pure.
 */

import type { Snapshot, Tombstone } from "../../types/snapshot";
import { TIMESTAMPLESS_TABLES } from "./merge-record-key";
import { mergeTableRows } from "./merge-table-rows";
import { tombstoneClocks, unionTombstones } from "./merge-tombstones";

type Row = Record<string, unknown>;

export function suppressLiveDeletes(
  snapshot: Snapshot,
  live: ReadonlyArray<Tombstone>
): Snapshot {
  const known = tombstoneClocks(snapshot.tombstones);
  const fresh = tombstoneClocks(live);
  const isNew = [...fresh].some(([key, at]) => (known.get(key) ?? -1) < at);
  if (!isNew) return snapshot;
  const tombstones = unionTombstones(snapshot.tombstones, live);
  const deletes = tombstoneClocks(tombstones);
  const tables = Object.fromEntries(
    Object.entries(snapshot.tables).map(([name, rows]) => [
      name,
      TIMESTAMPLESS_TABLES.has(name)
        ? rows
        : mergeTableRows(name, rows as Row[], deletes),
    ])
  );
  return { ...snapshot, tables, tombstones };
}
