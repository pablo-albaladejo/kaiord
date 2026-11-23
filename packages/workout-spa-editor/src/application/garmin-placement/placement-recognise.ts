/**
 * What a read before a POST recognises on the attempt's date, so no second
 * entry is posted there. First Kaiord's own entry that a read had left out
 * (`gone` but live): it is revived as the `Placed`, and any other of its
 * own on the date is a surplus to drain. Else an entry the record does not
 * know: Kaiord did not create it (the athlete placed the library workout,
 * or a lost record cannot prove otherwise), so it is recorded `recognised` —
 * the `Placed`, never moved, unscheduled or deleted unless another device's
 * record holds it as `created`.
 */
import type { GarminScheduleId } from "../../types/garmin-ledger";
import type { CalendarEntry } from "./garmin-calendar-port";
import { placedFrom } from "./placement-commit";
import { type PlacedEntries, recognisedBy } from "./placement-placed-row";
import { revivable, revived } from "./placement-revival";
import type { Attempt, Row } from "./placement-row";

export type Recognised = { id: GarminScheduleId; entries: PlacedEntries };

const byId = (x: string, y: string) =>
  x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);

const unknownOnDate = (
  attempt: Attempt,
  row: Row | undefined,
  found: readonly CalendarEntry[]
) => {
  const previous = attempt.previous;
  const known = new Set<string>([
    ...attempt.supersedes,
    ...(row?.removalQueue ?? []).map((e) => e.workoutScheduleId),
    ...(previous?.kind === "scheduled" ? [previous.workoutScheduleId] : []),
  ]);
  return found
    .flatMap((e) =>
      e.date === attempt.date && e.workoutScheduleId
        ? [e.workoutScheduleId]
        : []
    )
    .filter((id) => !known.has(id))
    .sort(byId);
};

export const recognise = (
  attempt: Attempt,
  row: Row | undefined,
  found: readonly CalendarEntry[]
): Recognised | undefined => {
  const [mine, ...surplus] = revivable(
    row,
    attempt.workoutId,
    attempt.date,
    found
  );
  if (mine)
    return {
      id: mine.workoutScheduleId,
      entries: {
        own: revived(mine, "keep"),
        extra: surplus.map((e) => revived(e, "retire")),
      },
    };
  const [lowest] = unknownOnDate(attempt, row, found);
  if (!lowest) return undefined;
  return { id: lowest, entries: recognisedBy(placedFrom(attempt, lowest)) };
};
