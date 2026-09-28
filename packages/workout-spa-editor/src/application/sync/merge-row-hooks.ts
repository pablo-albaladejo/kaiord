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

import { isGarminWorkoutLedgerRow } from "../../types/export-ledger";
import { normalizeGarminLedgerRow } from "../export/normalize-garmin-ledger-row";
import { ledgerClock, mergeExportLedgerRows } from "./merge-export-ledger-rows";
import { mergeGarminLedgerRows } from "./merge-garmin-ledger-rows";
import { recordClock, recordKey } from "./merge-record-key";

type Row = Record<string, unknown>;

export type RowMergeHook = {
  /** Natural key the table's unique index enforces. */
  key: (row: Row) => string;
  /** Pick the surviving row of two sharing `key`; must be symmetric. */
  merge: (a: Row, b: Row) => Row;
  /** Row clock for tombstone suppression; defaults to `recordClock`. */
  clock?: (row: Row) => number;
  /**
   * Shape-based, idempotent clean-up applied to every row of the table before
   * keying, in both the snapshot merge and the live import merge, so a row
   * from an older app version is normalized whatever its manifest version.
   */
  normalize?: (row: Row) => Row;
};

/** Garmin workout rows merge by supersession (MUST-D); every other ledger
    row keeps the plain total order. Both sides share the natural key, so
    they share the destination and data type. */
const mergeLedgerRows = (a: Row, b: Row): Row =>
  isGarminWorkoutLedgerRow(a) && isGarminWorkoutLedgerRow(b)
    ? mergeGarminLedgerRows(a, b)
    : mergeExportLedgerRows(a, b);

/**
 * Registry of natural-key merge hooks, one entry per table. Destination-
 * specific ledger merges (Garmin workout rows) dispatch inside the single
 * `exportLedger` entry — keep it a single entry.
 */
export const ROW_MERGE_HOOKS: Readonly<Record<string, RowMergeHook>> = {
  exportLedger: {
    key: (row) =>
      `${String(row.kaiordRecordId ?? "")}\u0000${String(row.destinationBridgeId ?? "")}`,
    merge: mergeLedgerRows,
    clock: ledgerClock,
    normalize: normalizeGarminLedgerRow,
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
