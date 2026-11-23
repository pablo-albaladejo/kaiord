/**
 * Resolves an `attempting{posted:true}` (design §3.4) — a leftover from an
 * earlier run, or this run's ambiguous POST after `SETTLE_MS`. The read
 * happens first; the decision is taken inside the guarded write, against
 * the re-read queue. One entry the record does not know, read by the run
 * that sent the POST after a read that found none (no "Send anyway"), is
 * the POST's own (`created`). A leftover from an earlier run, a "Send
 * anyway" or several entries cannot tell it from one the athlete placed,
 * so the adopted one is only `recognized` and is never deleted.
 * `repost`: what proven absence means to a leftover's
 * resolve; without it (this run already posted) there is no re-POST.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { PlacementRun } from "./placement-deps";
import { createdBy, placedRow, recognizedBy } from "./placement-placed-row";
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
import { type Attempt, decide, isAttemptAt } from "./placement-row";
import { undecided } from "./placement-undecided";

export type Settled =
  | { kind: "adopted"; placed: GarminPlaced; many: boolean }
  | { kind: "done"; result: PlacementResult };

type Verdict = ResolveDecision | { kind: "absent" } | { kind: "changed" };

type Read = {
  found: Parameters<typeof decideResolve>[2];
  readStartedAt: number;
  /** This run's own POST, sent after a read that found no unknown entry. */
  ownPost: boolean;
};

const decideInWrite = (
  run: PlacementRun,
  attempt: Attempt,
  { found, readStartedAt, ownPost }: Read
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
    const { placed, many } = verdict;
    const entries = ownPost && !many ? createdBy(placed) : recognizedBy(placed);
    return {
      write: placedRow(row, placed, attempt.previous, entries),
      verdict,
    };
  });

const done = (result: PlacementResult): Settled => ({ kind: "done", result });

export const resolveAttempt = async <R = never>(
  run: PlacementRun,
  attempt: Attempt,
  repost?: () => R
): Promise<Settled | R> => {
  if (!run.deps.canFind) return undecided(run, attempt, repost);
  const readStartedAt = run.deps.now();
  const read = await run.deps.calendar.find(attempt.workoutId, attempt.date);
  if (!read.ok) return undecided(run, attempt, repost);
  const { verdict } = await decideInWrite(run, attempt, {
    found: read.entries,
    readStartedAt,
    ownPost: !repost && !run.sendAnyway,
  });
  switch (verdict.kind) {
    case "adopt":
      return { kind: "adopted", placed: verdict.placed, many: verdict.many };
    case "absent":
      return done(recordDeleted(attempt.date));
    case "changed":
      return done(failed("guard-failed", true));
    case "uncertain":
      return undecided(run, attempt, repost);
    case "settling":
      return done(settling(verdict.retryAfter));
    case "repost":
      return repost ? repost() : done(settling(gateOf(attempt)));
  }
};
