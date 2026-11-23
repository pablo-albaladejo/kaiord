/**
 * The live state is read before a `schedule` POST is decided. The POST is
 * not idempotent, so when Garmin already holds an entry of this library
 * workout on the date that the record does not know (its placement was
 * lost: an older snapshot restored, a merge that dropped an attempt), that
 * entry is adopted instead of a second one being created. A read that
 * fails decides nothing: the claim goes back and no write is sent. "Send
 * anyway" is the athlete's explicit answer to an entry they do not see, so
 * it posts without this read. Without `calendar-find` or A3 there is
 * nothing to read by id, and the POST goes ahead as before.
 */
import {
  type GarminScheduleId,
  isGarminPlaced,
} from "../../types/garmin-ledger";
import { commitPlacement, placedFrom } from "./placement-commit";
import type { PlacementRun } from "./placement-deps";
import { finishPlacement } from "./placement-finish";
import {
  failed,
  type PlacementResult,
  recordDeleted,
} from "./placement-result";
import { restorePrevious } from "./placement-rollback";
import type { Attempt, Row } from "./placement-row";

const byId = (x: string, y: string) =>
  x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);

/** Unknown entries of the attempt's workout on its date, lowest id first;
    `undefined` when the read failed. */
const unknownEntries = async (run: PlacementRun, attempt: Attempt) => {
  const read = await run.deps.calendar.find(attempt.workoutId, attempt.date);
  if (!read.ok) return undefined;
  const previous = attempt.previous;
  const known = new Set<string>([
    ...attempt.supersedes,
    ...(isGarminPlaced(previous) && previous.kind === "scheduled"
      ? [previous.workoutScheduleId]
      : []),
  ]);
  return read.entries
    .filter((e) => e.date === attempt.date && e.workoutScheduleId)
    .map((e) => e.workoutScheduleId as GarminScheduleId)
    .filter((id) => !known.has(id))
    .sort(byId);
};

/** A result when the read settles the claim (adopted, or unreadable);
    `undefined` when the POST is still needed. */
export const readBeforePost = async (
  run: PlacementRun,
  claimed: Attempt,
  written: Row | undefined,
  preClaim: Row | undefined,
  leftBehind: readonly string[]
): Promise<PlacementResult | undefined> => {
  const { canFind, scheduleIdsInFind } = run.deps;
  if (run.sendAnyway || !canFind || !scheduleIdsInFind) return undefined;
  const ids = await unknownEntries(run, claimed);
  if (ids === undefined) {
    const v = await restorePrevious(run, claimed, written, preClaim);
    if (v === "absent") return recordDeleted();
    if (v === "changed") return failed("guard-failed", true);
    return failed("calendar-unreadable", true);
  }
  const [lowest] = ids;
  if (!lowest) return undefined;
  const placed = placedFrom(claimed, lowest);
  const verdict = await commitPlacement(run, claimed, placed, written);
  if (verdict === "absent") return recordDeleted(claimed.date);
  const kind = claimed.previous ? "moved" : "scheduled";
  const behind = [...leftBehind, ...(ids.length > 1 ? [claimed.date] : [])];
  return finishPlacement(run, placed, kind, behind);
};
