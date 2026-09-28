/**
 * Per-table row-merge hooks — natural-key identity for snapshot merges.
 *
 * Most tables merge by primary key (`recordKey`) with last-write-wins
 * (`pickByClock`). A table whose rows carry a UNIQUE natural key that is NOT
 * its primary key registers a hook here: `key` groups rows by that natural
 * key and `merge(a, b)` picks the survivor. Without it two devices that each
 * insert a row for the same natural key (different uuid ids) would both
 * survive the merge and the import would violate the unique index.
 *
 * `merge` MUST be symmetric (`merge(a, b)` equals `merge(b, a)`) so every
 * device converges on the same row regardless of pull order. Pure, no I/O.
 */

import { recordClock, recordKey } from "./merge-record-key";

type Row = Record<string, unknown>;

export type RowMergeHook = {
  /** Natural key the table's unique index enforces. */
  key: (row: Row) => string;
  /** Pick the surviving row of two sharing `key`; must be symmetric. */
  merge: (a: Row, b: Row) => Row;
  /** Row clock for tombstone suppression; defaults to `recordClock`. */
  clock?: (row: Row) => number;
};

const stampMs = (stamp: unknown): number => {
  if (typeof stamp !== "string") return 0;
  const ms = Date.parse(stamp);
  return Number.isNaN(ms) ? 0 : ms;
};

/**
 * Ledger clock: the later of `updatedAt` and `exportedAt`, so a row written by
 * an app version that predates `updatedAt` (and so bumps only `exportedAt`)
 * still reads as newer than its stale stamped copy.
 */
const ledgerClock = (row: Row): number =>
  Math.max(stampMs(row.updatedAt), stampMs(row.exportedAt));

const isCommitted = (row: Row) => row.destinationExternalId !== "pending";

/**
 * A committed row beats a `"pending"` one whatever their clocks — a pending
 * row is an in-flight POST that may still fail, and letting it win would
 * discard the destination id another device already committed. Then the
 * newer clock wins, then the lexicographically smaller `id`, then the smaller
 * serialisation (same id and clock, divergent content) — a total order,
 * hence symmetric.
 */
export function mergeExportLedgerRows(a: Row, b: Row): Row {
  if (isCommitted(a) !== isCommitted(b)) return isCommitted(a) ? a : b;
  const clockDiff = ledgerClock(a) - ledgerClock(b);
  if (clockDiff !== 0) return clockDiff > 0 ? a : b;
  const idA = String(a.id);
  const idB = String(b.id);
  if (idA !== idB) return idA < idB ? a : b;
  return JSON.stringify(a) <= JSON.stringify(b) ? a : b;
}

/**
 * Registry of natural-key merge hooks, one entry per table. The
 * `exportLedger` entry is the contract later destination-specific merges
 * (e.g. Garmin rows) replace — keep it a single entry.
 */
export const ROW_MERGE_HOOKS: Readonly<Record<string, RowMergeHook>> = {
  exportLedger: {
    key: (row) =>
      `${String(row.kaiordRecordId ?? "")}\u0000${String(row.destinationBridgeId ?? "")}`,
    merge: mergeExportLedgerRows,
    clock: ledgerClock,
  },
};

/** The table's registered hook; own keys only, never `Object.prototype`. */
export const rowMergeHookFor = (table: string): RowMergeHook | undefined =>
  Object.hasOwn(ROW_MERGE_HOOKS, table) ? ROW_MERGE_HOOKS[table] : undefined;

/** Default merge: the newer `updatedAt`/`createdAt` wins, ties keep `a`. */
function pickByClock(a: Row, b: Row): Row {
  return recordClock(b) > recordClock(a) ? b : a;
}

/** Merge identity for a row: the table's natural key, else its primary key. */
export const rowMergeKey = (table: string, row: Row): string =>
  rowMergeHookFor(table)?.key(row) ?? recordKey(table, row);

/** Clock a tombstone is compared against: the hook's clock, else the default. */
export const rowClock = (table: string, row: Row): number =>
  (rowMergeHookFor(table)?.clock ?? recordClock)(row);

/** Merge two rows sharing a key with the table's hook, else by clock. */
export const mergeRow = (table: string, a: Row, b: Row): Row =>
  (rowMergeHookFor(table)?.merge ?? pickByClock)(a, b);
