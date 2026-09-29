/**
 * Resolves an `attempting{posted:true}` (design §3.4) — a leftover from an
 * earlier run, or this run's ambiguous POST after `SETTLE_MS`. The read
 * happens first; the decision is taken inside the guarded write, against
 * the re-read queue. `inRun`: this run already posted, so no re-POST.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { PlacementRun } from "./placement-deps";
import {
  decideResolve,
  gateOf,
  type ResolveDecision,
} from "./placement-resolve";
import {
  failed,
  type PlacementResult,
  recordDeleted,
  settling,
} from "./placement-result";
import { type Attempt, decide, isAttemptAt, placedRow } from "./placement-row";
import { undecided } from "./placement-undecided";

export type ResolveOutcome =
  | { kind: "adopted"; placed: GarminPlaced; many: boolean }
  | { kind: "repost" }
  | { kind: "done"; result: PlacementResult };

type Verdict = ResolveDecision | { kind: "absent" } | { kind: "changed" };

const decideInWrite = (
  run: PlacementRun,
  attempt: Attempt,
  found: Parameters<typeof decideResolve>[2],
  readStartedAt: number
) =>
  decide<Verdict>(run.deps, run.key, (row) => {
    if (!row) return { verdict: { kind: "absent" } };
    if (!isAttemptAt(row, attempt.at)) return { verdict: { kind: "changed" } };
    const verdict = decideResolve(
      attempt,
      row,
      found,
      run.deps.scheduleIdsInFind,
      readStartedAt
    );
    if (verdict.kind !== "adopt") return { verdict };
    return { write: placedRow(row, verdict.placed, attempt.previous), verdict };
  });

export const resolveAttempt = async (
  run: PlacementRun,
  attempt: Attempt,
  inRun: boolean
): Promise<ResolveOutcome> => {
  if (!run.deps.canFind) return undecided(run, attempt, inRun);
  const readStartedAt = run.deps.now();
  const read = await run.deps.calendar.find(attempt.workoutId, attempt.date);
  if (!read.ok) return undecided(run, attempt, inRun);
  const { verdict } = await decideInWrite(
    run,
    attempt,
    read.entries,
    readStartedAt
  );
  const done = (result: PlacementResult): ResolveOutcome => ({
    kind: "done",
    result,
  });
  switch (verdict.kind) {
    case "adopt":
      return { kind: "adopted", placed: verdict.placed, many: verdict.many };
    case "absent":
      return done(recordDeleted(attempt.date));
    case "changed":
      return done(failed("guard-failed", true));
    case "uncertain":
      return undecided(run, attempt, inRun);
    case "settling":
      return done(settling(verdict.retryAfter));
    case "repost":
      return inRun ? done(settling(gateOf(attempt))) : { kind: "repost" };
  }
};
