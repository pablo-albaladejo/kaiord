/**
 * Row helpers shared by the placement steps. Every write is one
 * `mutateByKey` (its own transaction, re-reading the row by natural key);
 * `decide` lets a step return a verdict from inside that transaction.
 */
import type {
  ExportLedgerEntry,
  LedgerMutation,
} from "../../types/export-ledger";
import {
  type GarminPlaced,
  type GarminPlacement,
  isGarminPlaced,
} from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import {
  entryOf,
  joinQueues,
  sortedQueue,
} from "../sync/merge-garmin-removal-queue";
import type { LedgerKey, PlacementDeps } from "./placement-deps";

export type Row = ExportLedgerEntry;
export type Attempt = Extract<GarminPlacement, { kind: "attempting" }>;
export type Decision<V> = { write?: LedgerMutation; verdict: V };

export const decide = async <V>(
  deps: Pick<PlacementDeps, "ledgerRepo">,
  key: LedgerKey,
  fn: (row: Row | undefined) => Decision<V>
): Promise<{ verdict: V; after: Row | undefined }> => {
  const box: { verdict?: V } = {};
  const after = await deps.ledgerRepo.mutateByKey(key, (row) => {
    const decision = fn(row);
    box.verdict = decision.verdict;
    return decision.write;
  });
  return { verdict: box.verdict as V, after };
};

/** Raises `entries` into the row's queue (join by max; nothing removed). */
export const withEntries = (row: Row, entries: GarminRemovalEntry[]): Row =>
  entries.length === 0
    ? row
    : {
        ...row,
        removalQueue: sortedQueue(joinQueues(row.removalQueue, entries)),
      };

/** The row still holds the attempt written at `at` (the write guard). */
export const isAttemptAt = (row: Row | undefined, at: string): boolean =>
  row?.placement?.kind === "attempting" && row.placement.at === at;

/** Same calendar entry: by schedule id, else by workout and date. */
export const samePlaced = (x: GarminPlaced, y: GarminPlaced): boolean =>
  x.kind === "scheduled" && y.kind === "scheduled"
    ? x.workoutScheduleId === y.workoutScheduleId
    : x.workoutId === y.workoutId && x.date === y.date;

/** The row still carries this run's `Placed` (the post-commit guard). */
export const holdsPlaced = (row: Row | undefined, placed: GarminPlaced) =>
  isGarminPlaced(row?.placement) && samePlaced(row.placement, placed);

/** A superseded `scheduled` previous is retired with the new `Placed`. */
export const retiredBy = (
  previous: GarminPlaced | undefined,
  placed: GarminPlaced
): GarminRemovalEntry[] =>
  previous?.kind === "scheduled" &&
  !(placed.kind === "scheduled" && samePlaced(previous, placed))
    ? [entryOf(previous, "retire")]
    : [];

/** A new `Placed` with its id `keep` and a superseded previous `retire`. */
export const placedRow = (
  row: Row,
  placed: GarminPlaced,
  previous: GarminPlaced | undefined
): Row =>
  withEntries({ ...row, placement: placed }, [
    ...(placed.kind === "scheduled" ? [entryOf(placed, "keep")] : []),
    ...retiredBy(previous, placed),
  ]);

/** "It's in Garmin" is safe: no non-`keep` entry shares workout and date. */
export const canConfirmAt = (
  row: Row | undefined,
  workoutId: string,
  date: string
): boolean =>
  !(row?.removalQueue ?? []).some(
    (e) => e.workoutId === workoutId && e.date === date && e.state !== "keep"
  );

/** A placement with no `previous` key at all when there is none. */
export const withoutUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as T;
