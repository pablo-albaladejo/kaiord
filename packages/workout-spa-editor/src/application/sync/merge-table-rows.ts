/**
 * Row-level table merge shared by `mergeSnapshots` and the `SnapshotPort`
 * live import.
 *
 * `mergeTableRows` drops every row a newer tombstone suppresses (against the
 * table's `rowClock`, the same clock its merge uses), then folds the rest by
 * merge key (`rowMergeKey`) with the table's merge (`mergeRow`). Suppressing
 * BEFORE the fold means that, within ONE merge, a tombstoned row never
 * out-merges a live sibling sharing its natural key.
 *
 * Across successive pairwise merges the result is only transiently
 * order-dependent: if a row beats its sibling in a merge that has not yet seen
 * the row's tombstone, the sibling is dropped from that merged snapshot and the
 * later tombstone leaves the key empty. It converges back while any device
 * still holds the sibling, because the live import keeps it and re-pushes it.
 *
 * `createLiveRowMerge` is the import-side entry: the adapter merges the rows
 * already in the database with the incoming snapshot instead of replacing
 * them, so a write that landed after the snapshot was exported survives.
 * Pure, no I/O.
 */

import type { LiveRowMerge } from "../../ports/snapshot-port";
import type { Tombstone } from "../../types/snapshot";
import {
  mergeRow,
  rowClock,
  rowMergeHookFor,
  rowMergeKey,
} from "./merge-row-hooks";
import { tombstoneClocks, tombstoneKey } from "./merge-tombstones";

type Row = Record<string, unknown>;

const isSuppressed = (
  table: string,
  row: Row,
  deletes: Map<string, number>
) => {
  // Tombstones are keyed by `[table+id]`; only id-keyed rows can be
  // suppressed, so non-id tables (which are never tombstoned) pass through.
  const id = row.id;
  if (typeof id !== "string") return false;
  const deletedAt = deletes.get(tombstoneKey(table, id));
  return deletedAt !== undefined && rowClock(table, row) <= deletedAt;
};

/** Merge rows of one table by merge key, dropping tombstone-suppressed rows. */
export function mergeTableRows(
  table: string,
  rows: ReadonlyArray<Row>,
  deletes: Map<string, number>
): Row[] {
  const byKey = new Map<string, Row>();
  for (const row of rows) {
    if (isSuppressed(table, row, deletes)) continue;
    const k = rowMergeKey(table, row);
    const current = byKey.get(k);
    byKey.set(k, current ? mergeRow(table, current, row) : row);
  }
  return [...byKey.values()];
}

/**
 * Build the `SnapshotPort.importTables` live merge: tables with a hook merge
 * their live rows with the incoming snapshot rows, so a live row absent from
 * the snapshot is kept unless one of `tombstones` deletes it. Tables without
 * a hook get `undefined` and are replaced wholesale.
 */
export const createLiveRowMerge =
  (tombstones: ReadonlyArray<Tombstone>): LiveRowMerge =>
  (table) => {
    if (rowMergeHookFor(table) === undefined) return undefined;
    const deletes = tombstoneClocks(tombstones);
    return (live, incoming) =>
      mergeTableRows(table, [...live, ...incoming] as Row[], deletes);
  };
