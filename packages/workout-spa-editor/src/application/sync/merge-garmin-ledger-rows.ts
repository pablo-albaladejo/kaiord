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
  stampMs,
} from "./merge-export-ledger-rows";
import { mergeGarminPlacement } from "./merge-garmin-placement";

type Row = Record<string, unknown>;

/** The later stamp by the ledger clock's own parse (unparsable = 0); an
    equal instant in a different spelling, or two unparsable stamps, is
    broken by the larger string — a total order, hence symmetric. */
const laterStamp = (x: unknown, y: unknown): unknown => {
  const diff = stampMs(x) - stampMs(y);
  if (diff !== 0) return diff > 0 ? x : y;
  const sx = typeof x === "string" ? x : "";
  const sy = typeof y === "string" ? y : "";
  if (sx !== sy) return sx > sy ? x : y;
  return x ?? y;
};

export function mergeGarminLedgerRows(a: Row, b: Row): Row {
  // A pending row is an in-flight library POST: Phase 1 never writes
  // `placement` or `removalQueue` on it (placement starts after the commit),
  // so returning the committed row whole loses no Garmin state.
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
