/**
 * mergeGarminLedgerRows — the `exportLedger` merge for Garmin workout rows.
 *
 * #1265's rule runs first: a committed row beats a `"pending"` one. Otherwise
 * the ledger total order (clock, then `id`, then serialisation) names the
 * newer row, which supplies every scalar field — `library` and `forceRepush`
 * included, never mixed with the older row's — while the placement and the
 * removal queue merge by supersession (`mergeGarminPlacement`). `updatedAt`
 * is the later of the two. Symmetric: `merge(a, b)` equals `merge(b, a)`.
 * Pure, no I/O.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import {
  isCommittedLedgerRow,
  mergeExportLedgerRows,
} from "./merge-export-ledger-rows";
import { mergeGarminPlacement } from "./merge-garmin-placement";

type Row = Record<string, unknown>;

const laterStamp = (x: unknown, y: unknown): unknown => {
  if (typeof x !== "string") return y;
  if (typeof y !== "string") return x;
  return Date.parse(y) > Date.parse(x) ? y : x;
};

export function mergeGarminLedgerRows(a: Row, b: Row): Row {
  const committedA = isCommittedLedgerRow(a);
  if (committedA !== isCommittedLedgerRow(b)) return committedA ? a : b;
  const newer = mergeExportLedgerRows(a, b);
  const older = newer === a ? b : a;
  const { placement, queue } = mergeGarminPlacement(
    newer as ExportLedgerEntry,
    older as ExportLedgerEntry
  );
  const merged: Row = { ...newer };
  delete merged.placement;
  delete merged.removalQueue;
  if (placement) merged.placement = placement;
  const hadQueue = a.removalQueue !== undefined || b.removalQueue !== undefined;
  if (queue.length > 0 || hadQueue) merged.removalQueue = queue;
  const updatedAt = laterStamp(a.updatedAt, b.updatedAt);
  if (updatedAt !== undefined) merged.updatedAt = updatedAt;
  return merged;
}
