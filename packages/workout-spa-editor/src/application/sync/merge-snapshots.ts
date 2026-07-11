/**
 * mergeSnapshots — pure last-write-wins snapshot merge.
 *
 * Merges a local and remote `Snapshot` per table, per record (keyed by
 * primary key) keeping the side whose `updatedAt`/`createdAt` is newer.
 * Timestampless tables (`meta`) merge whole-record using the manifest
 * `exportedAt`. Tombstones are unioned (newest `deletedAt` per key) and
 * suppress any record whose clock is older. No Drive or Dexie dependency —
 * testable with plain objects.
 */

import type { Snapshot } from "../../types/snapshot";
import {
  recordClock,
  recordKey,
  TIMESTAMPLESS_TABLES,
} from "./merge-record-key";
import {
  tombstoneClocks,
  tombstoneKey,
  unionTombstones,
} from "./merge-tombstones";

type Row = Record<string, unknown>;

const asRows = (rows: ReadonlyArray<unknown> | undefined): Row[] =>
  (rows ?? []) as Row[];

function pickByClock(a: Row | undefined, b: Row | undefined): Row | undefined {
  if (!a) return b;
  if (!b) return a;
  return recordClock(b) > recordClock(a) ? b : a;
}

function mergeTable(
  table: string,
  local: ReadonlyArray<unknown> | undefined,
  remote: ReadonlyArray<unknown> | undefined,
  localNewer: boolean,
  deletes: Map<string, number>
): Row[] {
  if (TIMESTAMPLESS_TABLES.has(table))
    return asRows(localNewer ? local : remote);
  const byKey = new Map<string, Row>();
  for (const row of [...asRows(local), ...asRows(remote)]) {
    const k = recordKey(table, row);
    byKey.set(k, pickByClock(byKey.get(k), row) as Row);
  }
  return [...byKey.values()].filter((row) => {
    // Tombstones are keyed by `[table+id]`; only id-keyed rows can be
    // suppressed, so non-id tables (which are never tombstoned) pass through.
    const id = row.id;
    if (typeof id !== "string") return true;
    const deletedAt = deletes.get(tombstoneKey(table, id));
    return deletedAt === undefined || recordClock(row) > deletedAt;
  });
}

export function mergeSnapshots(local: Snapshot, remote: Snapshot): Snapshot {
  const localNewer =
    Date.parse(local.manifest.exportedAt) >=
    Date.parse(remote.manifest.exportedAt);
  const tombstones = unionTombstones(local.tombstones, remote.tombstones);
  const deletes = tombstoneClocks(tombstones);
  const names = new Set([
    ...Object.keys(local.tables),
    ...Object.keys(remote.tables),
  ]);
  const tables: Record<string, Row[]> = {};
  for (const name of names) {
    tables[name] = mergeTable(
      name,
      local.tables[name],
      remote.tables[name],
      localNewer,
      deletes
    );
  }
  return {
    manifest: localNewer ? local.manifest : remote.manifest,
    tables,
    tombstones,
  };
}
