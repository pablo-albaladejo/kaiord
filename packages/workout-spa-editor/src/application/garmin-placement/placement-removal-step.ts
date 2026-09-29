/**
 * Step 8 (design §3.5): drain the removal queue. Only `retire` entries are
 * sent, once per run in ascending id order, never the current `Placed` or
 * `attempting.previous` (skip rule), and only while the row still carries
 * this run's `Placed`. Each outcome writes only its own entry's state on the
 * re-read row, so concurrent queue additions survive. A reauth answer ends
 * the drain, abandoned-entry re-checks included. Nothing is sent unless the
 * `Placed` was first seen on Garmin (`verifyPlaced`, verify before delete).
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { joinQueues, sortedQueue } from "../sync/merge-garmin-removal-queue";
import { absentFromCalendar } from "./placement-absence";
import type { PlacementRun } from "./placement-deps";
import { recordDrain } from "./placement-record-drain";
import { holdsPlaced, type Row } from "./placement-row";
import { verifyPlaced } from "./placement-verify-placed";

type DrainOutcome = "gone" | "count" | "reauth";

/** The skip rule: the current `Placed` and `attempting.previous`. */
export const protectedIds = (row: Row | undefined) => {
  const p = row?.placement;
  const ids = [p?.kind === "scheduled" ? p.workoutScheduleId : undefined];
  if (p?.kind === "attempting" && p.previous?.kind === "scheduled")
    ids.push(p.previous.workoutScheduleId);
  return new Set(ids.filter(Boolean));
};

const drainable = (row: Row | undefined, abandoned: boolean) => {
  const skip = protectedIds(row);
  return sortedQueue(joinQueues(row?.removalQueue)).filter(
    (e) =>
      e.state === "retire" &&
      e.abandoned === abandoned &&
      !skip.has(e.workoutScheduleId)
  );
};

const sendOne = async (
  run: PlacementRun,
  entry: GarminRemovalEntry
): Promise<DrainOutcome> => {
  const answer = await run.deps.calendar.unschedule(entry.workoutScheduleId);
  if (answer.ok) return "gone";
  if (
    answer.status === 401 ||
    (answer.status === undefined && answer.needsReauth)
  )
    return "reauth";
  if (answer.status === 404 && (await absentFromCalendar(run, entry)))
    return "gone";
  return "count";
};

const stillOurs = async (
  run: PlacementRun,
  guard: GarminPlaced,
  id: string
) => {
  const row = await run.deps.ledgerRepo.findByNaturalKey(run.key);
  return (
    holdsPlaced(row, guard) &&
    drainable(row, false).some((e) => e.workoutScheduleId === id)
  );
};

export const drainQueue = async (run: PlacementRun, guard: GarminPlaced) => {
  const row = await run.deps.ledgerRepo.findByNaturalKey(run.key);
  if (!holdsPlaced(row, guard)) return;
  const toSend = drainable(row, false);
  if (toSend.length > 0 && !(await verifyPlaced(run, guard))) return;
  for (const entry of toSend) {
    if (!(await stillOurs(run, guard, entry.workoutScheduleId))) return;
    const outcome = await sendOne(run, entry);
    if (outcome === "reauth") return;
    if (!(await recordDrain(run, guard, entry.workoutScheduleId, outcome)))
      return;
  }
  for (const entry of drainable(row, true)) {
    if (!(await absentFromCalendar(run, entry))) continue;
    if (!(await recordDrain(run, guard, entry.workoutScheduleId, "gone")))
      return;
  }
};
