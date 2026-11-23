/**
 * The live state is read before a `schedule` POST is decided. The POST is
 * not idempotent, so when Garmin already holds an entry of this library
 * workout on the date, no second one is created: Kaiord's own entry that a
 * read had left out is revived, and an entry Kaiord did not create is
 * recognized as the `Placed` but recorded so, and it is never moved,
 * unscheduled or deleted (`placement-recognize`). A read that fails decides
 * nothing: the claim goes back and no write is sent. "Send anyway" is the
 * athlete's explicit answer to an entry they do not see, so it posts
 * without this read. Without `calendar-find` or A3 there is nothing to read
 * by id, and the POST goes ahead as before.
 */
import { commitPlacement, placedFrom } from "./placement-commit";
import type { PlacementRun } from "./placement-deps";
import { finishPlacement } from "./placement-finish";
import { readsById } from "./placement-live-read";
import { recognize } from "./placement-recognize";
import {
  failed,
  type PlacementResult,
  recordDeleted,
} from "./placement-result";
import { restorePrevious } from "./placement-rollback";
import type { Attempt, Row } from "./placement-row";

export type PostContext = {
  /** The row the claim wrote, and the row before it. */
  written?: Row;
  preClaim?: Row;
  leftBehind: readonly string[];
};

const unreadable = async (
  run: PlacementRun,
  claimed: Attempt,
  { written, preClaim }: PostContext
) => {
  const v = await restorePrevious(run, claimed, written, preClaim);
  if (v === "absent") return recordDeleted();
  if (v === "changed") return failed("guard-failed", true);
  return failed("calendar-unreadable", true);
};

/** A result when the read settles the claim (recognized, or unreadable);
    `undefined` when the POST is still needed. */
export const readBeforePost = async (
  run: PlacementRun,
  claimed: Attempt,
  context: PostContext
): Promise<PlacementResult | undefined> => {
  if (run.sendAnyway || !readsById(run.deps)) return undefined;
  const read = await run.deps.calendar.find(claimed.workoutId, claimed.date);
  if (!read.ok) return unreadable(run, claimed, context);
  const row = context.written ?? context.preClaim;
  const found = recognize(claimed, row, read.entries);
  if (!found) return undefined;
  const placed = placedFrom(claimed, found.id);
  const { written } = context;
  const verdict = await commitPlacement(
    run,
    claimed,
    placed,
    written,
    found.entries
  );
  if (verdict === "absent") return recordDeleted(claimed.date);
  if (verdict === "stale") return undefined;
  const kind = claimed.previous ? "moved" : "scheduled";
  return finishPlacement(run, placed, kind, context.leftBehind);
};
