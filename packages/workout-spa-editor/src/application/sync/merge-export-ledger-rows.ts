/**
 * The export-ledger row order shared by every ledger merge: a committed row
 * beats a `"pending"` one, then the newer ledger clock wins, then the smaller
 * `id`, then the smaller serialisation — a total order, hence symmetric.
 * Pure, no I/O.
 */

type Row = Record<string, unknown>;

export const stampMs = (stamp: unknown): number => {
  if (typeof stamp !== "string") return 0;
  const ms = Date.parse(stamp);
  return Number.isNaN(ms) ? 0 : ms;
};

/**
 * Ledger clock: the later of `updatedAt` and `exportedAt`, so a row written by
 * an app version that predates `updatedAt` (and so bumps only `exportedAt`)
 * still reads as newer than its stale stamped copy.
 */
export const ledgerClock = (row: Row): number =>
  Math.max(stampMs(row.updatedAt), stampMs(row.exportedAt));

export const isCommittedLedgerRow = (row: Row): boolean =>
  row.destinationExternalId !== "pending";

/**
 * A committed row beats a `"pending"` one whatever their clocks — a pending
 * row is an in-flight POST that may still fail, and letting it win would
 * discard the destination id another device already committed. Then the
 * newer clock wins, then the lexicographically smaller `id`, then the smaller
 * serialisation (same id and clock, divergent content) — a total order,
 * hence symmetric.
 */
export function mergeExportLedgerRows(a: Row, b: Row): Row {
  const committedA = isCommittedLedgerRow(a);
  if (committedA !== isCommittedLedgerRow(b)) return committedA ? a : b;
  const clockDiff = ledgerClock(a) - ledgerClock(b);
  if (clockDiff !== 0) return clockDiff > 0 ? a : b;
  const idA = String(a.id);
  const idB = String(b.id);
  if (idA !== idB) return idA < idB ? a : b;
  return JSON.stringify(a) <= JSON.stringify(b) ? a : b;
}
