/**
 * The T5 adoption, pure: the one entry of the `uncertain`'s workout on its
 * date that the reads show and the queue does not hold dead. Kaiord's own
 * entry the record holds `gone` but the reads show is revived; one the
 * record does not know is only `recognised` and never deleted. `held` ids
 * the reads do not see become `gone` (A3 only). A number: how many matched.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import type { Uncertain } from "./placement-claim";
import {
  type PlacedEntries,
  placedRow,
  recognisedBy,
} from "./placement-placed-row";
import { revivable, revived } from "./placement-revival";
import { canConfirmAt, type Row, withEntries } from "./placement-row";
import type { readHeldMonths } from "./placement-t5-read";

type Reads = NonNullable<Awaited<ReturnType<typeof readHeldMonths>>>;
/** The adopted entry: Kaiord's own revived, or one the record does not
    know recorded `recognised` (never deleted); else as the queue holds it. */
const entriesFor = (
  row: Row,
  placed: GarminPlaced,
  alive: readonly GarminRemovalEntry[]
): PlacedEntries => {
  if (placed.kind !== "scheduled") return {};
  const id = placed.workoutScheduleId;
  const mine = alive.find((e) => e.workoutScheduleId === id);
  if (mine) return { own: revived(mine, "keep") };
  const known = (row.removalQueue ?? []).some(
    (e) => e.workoutScheduleId === id
  );
  return known ? {} : recognisedBy(placed);
};

export const adoption = (u: Uncertain, row: Row, reads: Reads, a3: boolean) => {
  const alive = a3 ? revivable(row, u.workoutId, u.date, reads.entries) : [];
  const revive = new Set(alive.map((e) => e.workoutScheduleId));
  const dead = new Set(
    (row.removalQueue ?? [])
      .filter((e) => e.state === "retire" || e.state === "gone")
      .map((e) => e.workoutScheduleId)
      .filter((id) => !revive.has(id))
  );
  const matches = reads.entries.filter(
    (e) =>
      e.workoutId === u.workoutId &&
      e.date === u.date &&
      !(e.workoutScheduleId && dead.has(e.workoutScheduleId))
  );
  const [match] = matches;
  if (!match || matches.length > 1) return matches.length;
  const id = match.workoutScheduleId;
  if (!id && !canConfirmAt(row, u.workoutId, u.date)) return 0;
  const placed: GarminPlaced = id
    ? {
        kind: "scheduled",
        workoutScheduleId: id,
        workoutId: u.workoutId,
        date: u.date,
      }
    : {
        kind: "unconfirmed",
        workoutId: u.workoutId,
        date: u.date,
        supersedes: [],
      };
  const unseen = (row.removalQueue ?? []).filter(
    (e) =>
      e.state === "held" && id && a3 && !reads.seen.has(e.workoutScheduleId)
  );
  const gone = unseen.map((e) => ({ ...e, state: "gone" as const }));
  const entries = entriesFor(row, placed, alive);
  const adopted = placedRow(row, placed, u.previous, entries);
  return { placed, row: withEntries(adopted, gone) };
};
