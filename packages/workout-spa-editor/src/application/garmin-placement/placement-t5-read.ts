/**
 * The T5 read: one `calendar-find` per distinct (workout, month) among the
 * `uncertain` and its `held` entries. Any failed read fails the whole
 * resolution (`undefined`).
 */
import type { CalendarEntry } from "./garmin-calendar-port";
import type { Uncertain } from "./placement-claim";
import type { PlacementRun } from "./placement-deps";

export type T5Entry = CalendarEntry & { workoutId: string };

export const readHeldMonths = async (run: PlacementRun, u: Uncertain) => {
  const row = await run.deps.ledgerRepo.findByNaturalKey(run.key);
  const held = (row?.removalQueue ?? []).filter((e) => e.state === "held");
  const targets = new Map<
    string,
    { workoutId: typeof u.workoutId; date: string }
  >();
  for (const t of [u, ...held])
    targets.set(`${t.workoutId}\u0000${t.date.slice(0, 7)}`, t);
  const entries: T5Entry[] = [];
  for (const t of targets.values()) {
    const read = await run.deps.calendar.find(t.workoutId, t.date);
    if (!read.ok) return undefined;
    entries.push(
      ...read.entries.map((e) => ({ ...e, workoutId: t.workoutId }))
    );
  }
  const ids = entries.flatMap((e) =>
    e.workoutScheduleId ? [e.workoutScheduleId] : []
  );
  return {
    entries,
    seen: new Set<string>(ids),
    allHaveIds: ids.length === entries.length,
  };
};
