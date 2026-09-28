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
 *   malformed queue entry is removed, the rest of the queue kept). The
 *   parsed placement is stored, so an `unconfirmed` with no `supersedes`
 *   (legacy) gets `[]` and every list is sorted and unique.
 * - A queue entry with no `state` (legacy) is `held`: unverified, so never
 *   drained. The id of a `scheduled` placement or `previous` is `keep`
 *   unless the queue already gives it a state. The queue is joined by id
 *   and sorted, as the merge emits it.
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
  type GarminPlacement,
  garminPlacementSchema,
  parseGarminWorkoutId,
} from "../../types/garmin-ledger";
import {
  type GarminRemovalEntry,
  garminRemovalEntrySchema,
} from "../../types/garmin-removal-entry";
import {
  entryOf,
  joinQueues,
  sortedQueue,
} from "../sync/merge-garmin-removal-queue";

type Row = Record<string, unknown>;

const deriveLibrary = (row: Row): GarminLibraryState => {
  const parsed = garminLibraryStateSchema.safeParse(row.library);
  if (parsed.success) return parsed.data;
  const workoutId = parseGarminWorkoutId(row.destinationExternalId);
  return workoutId ? { kind: "confirmed", workoutId } : { kind: "unconfirmed" };
};

/** Valid entries, split into those that carry a state and legacy ones. */
const parseQueue = (queue: unknown[]) => {
  const stated: GarminRemovalEntry[] = [];
  const legacy: GarminRemovalEntry[] = [];
  for (const raw of queue) {
    const stateless =
      typeof raw === "object" && raw !== null && !("state" in raw);
    const parsed = garminRemovalEntrySchema.safeParse(
      stateless ? { ...raw, state: "held" } : raw
    );
    if (parsed.success) (stateless ? legacy : stated).push(parsed.data);
  }
  return { stated, legacy };
};

/** The `scheduled` ids this row treats as live: its Placed and `previous`. */
const liveIds = (placement: GarminPlacement | undefined) => {
  const previous =
    placement?.kind === "attempting" || placement?.kind === "uncertain"
      ? placement.previous
      : undefined;
  return [placement, previous].flatMap((p) =>
    p?.kind === "scheduled" ? [entryOf(p, "keep")] : []
  );
};

const normalizeQueue = (queue: unknown[], placement?: GarminPlacement) => {
  const { stated, legacy } = parseQueue(queue);
  const live = liveIds(placement);
  const statedIds = new Set(stated.map((e) => e.workoutScheduleId));
  const liveIdsSet = new Set(live.map((e) => e.workoutScheduleId));
  const kept = legacy.filter((e) => !liveIdsSet.has(e.workoutScheduleId));
  const added = live.filter((e) => !statedIds.has(e.workoutScheduleId));
  return sortedQueue(joinQueues(stated, kept, added));
};

export function normalizeGarminLedgerRow<T extends Row | ExportLedgerEntry>(
  row: T
): T {
  if (!isGarminWorkoutLedgerRow(row)) return row;
  const source = row as Row;
  const next: Row = { ...source, library: deriveLibrary(source) };
  if (source.forceRepush !== true) delete next.forceRepush;
  const placement = garminPlacementSchema.safeParse(source.placement);
  const livePlacement = placement.success ? placement.data : undefined;
  if (livePlacement) next.placement = livePlacement;
  else delete next.placement;
  const raw = Array.isArray(source.removalQueue) ? source.removalQueue : [];
  const queue = normalizeQueue(raw, livePlacement);
  if (queue.length > 0 || Array.isArray(source.removalQueue))
    next.removalQueue = queue;
  else delete next.removalQueue;
  return next as T;
}
