/**
 * Import-side guard for the window between a sync's export read and its
 * import transaction. A live row that differs from what the export read (a
 * new key, or a changed row) was written inside that window: it is kept
 * over its incoming counterpart unless that counterpart is newer by clock,
 * and dropped only when a tombstone at least as new deletes it. Every other
 * live row is replaced by the incoming snapshot, so the merge, the default
 * profile re-key and the orphan filters still decide what survives. Pure.
 */

import { recordClock, recordKey, tombstoneIdOf } from "./merge-record-key";
import { tombstoneKey } from "./merge-tombstones";

type Row = Record<string, unknown>;

const isDeleted = (table: string, row: Row, deletes: Map<string, number>) => {
  const id = tombstoneIdOf(table, row);
  if (id === undefined) return false;
  const deletedAt = deletes.get(tombstoneKey(table, id));
  return deletedAt !== undefined && recordClock(row) <= deletedAt;
};

export const mergePostExportWrites = (
  table: string,
  exported: ReadonlyArray<Row>,
  deletes: Map<string, number>
) => {
  const before = new Map(
    exported.map((row) => [recordKey(table, row), JSON.stringify(row)])
  );
  return (live: ReadonlyArray<Row>, incoming: ReadonlyArray<Row>): Row[] => {
    const fresh = live.filter(
      (row) => before.get(recordKey(table, row)) !== JSON.stringify(row)
    );
    if (fresh.length === 0) return [...incoming];
    const byKey = new Map(incoming.map((row) => [recordKey(table, row), row]));
    for (const row of fresh) {
      if (isDeleted(table, row, deletes)) continue;
      const key = recordKey(table, row);
      const current = byKey.get(key);
      if (!current || recordClock(row) >= recordClock(current))
        byKey.set(key, row);
    }
    return [...byKey.values()];
  };
};
