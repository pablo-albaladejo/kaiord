/**
 * normalizeGarminLedgerRow — shape-based, idempotent clean-up of a Garmin
 * workout ledger row, run by the Dexie v36 upgrade and on every row a
 * snapshot import brings in (the `exportLedger` merge hook's `normalize`),
 * whatever the snapshot's manifest version.
 *
 * - `library` is derived once, when absent or invalid, from the legacy
 *   `destinationExternalId`: a Garmin-shaped id is `confirmed`; anything else
 *   (`"pending"`, the `"garmin-unconfirmed"` sentinel) is `unconfirmed`.
 *   After that only `library` is read, never the overloaded external id.
 * - Every Garmin field is schema-parsed; an invalid part is dropped (a
 *   malformed queue entry is removed, the rest of the queue kept).
 *
 * Rows of any other destination or data type are returned untouched.
 */
import {
  type ExportLedgerEntry,
  isGarminWorkoutLedgerRow,
} from "../../types/export-ledger";
import {
  type GarminLibraryState,
  garminLibraryStateSchema,
  garminPlacementSchema,
  garminRemovalEntrySchema,
  parseGarminWorkoutId,
} from "../../types/garmin-ledger";

type Row = Record<string, unknown>;

const deriveLibrary = (row: Row): GarminLibraryState => {
  const parsed = garminLibraryStateSchema.safeParse(row.library);
  if (parsed.success) return parsed.data;
  const workoutId = parseGarminWorkoutId(row.destinationExternalId);
  return workoutId ? { kind: "confirmed", workoutId } : { kind: "unconfirmed" };
};

const validQueue = (queue: unknown) =>
  Array.isArray(queue)
    ? queue.filter((e) => garminRemovalEntrySchema.safeParse(e).success)
    : undefined;

export function normalizeGarminLedgerRow<T extends Row | ExportLedgerEntry>(
  row: T
): T {
  if (!isGarminWorkoutLedgerRow(row)) return row;
  const source = row as Row;
  const next: Row = { ...source, library: deriveLibrary(source) };
  if (source.forceRepush !== true) delete next.forceRepush;
  if (!garminPlacementSchema.safeParse(source.placement).success)
    delete next.placement;
  const queue = validQueue(source.removalQueue);
  if (queue) next.removalQueue = queue;
  else delete next.removalQueue;
  return next as T;
}
