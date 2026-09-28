/**
 * mergeSnapshots — pure last-write-wins snapshot merge.
 *
 * Merges a local and remote `Snapshot` per table, per record (keyed by
 * primary key) keeping the side whose `updatedAt`/`createdAt` is newer.
 * Tables with a natural-key hook (`ROW_MERGE_HOOKS`, e.g. `exportLedger`)
 * are keyed and merged by that hook instead.
 * Timestampless tables (`meta`) merge whole-record using the manifest
 * `exportedAt`. Tombstones are unioned (newest `deletedAt` per key) and
 * suppress any record whose clock is older. No Drive or Dexie dependency —
 * testable with plain objects.
 */

import type { Snapshot } from "../../types/snapshot";
import { TIMESTAMPLESS_TABLES } from "./merge-record-key";
import { mergeTableRows } from "./merge-table-rows";
import { tombstoneClocks, unionTombstones } from "./merge-tombstones";

type Row = Record<string, unknown>;

const asRows = (rows: ReadonlyArray<unknown> | undefined): Row[] =>
  (rows ?? []) as Row[];

function mergeTable(
  table: string,
  local: ReadonlyArray<unknown> | undefined,
  remote: ReadonlyArray<unknown> | undefined,
  localNewer: boolean,
  deletes: Map<string, number>
): Row[] {
  if (TIMESTAMPLESS_TABLES.has(table))
    return asRows(localNewer ? local : remote);
  return mergeTableRows(table, [...asRows(local), ...asRows(remote)], deletes);
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
