/**
 * Steps 5–8 for one claimed attempt: the run's single POST, then commit and
 * drain (ok), roll back (definite), or settle and read (ambiguous — never a
 * second POST in the same run).
 */
import type { DefiniteReason } from "./classify-bridge-write";
import { commitPlacement, placedFrom } from "./placement-commit";
import type { PlacementRun } from "./placement-deps";
import { finishPlacement, unconfirmedLeftBehind } from "./placement-finish";
import { resolveAttempt } from "./placement-resolve-step";
import {
  failed,
  type PlacementResult,
  recordDeleted,
} from "./placement-result";
import { restorePrevious } from "./placement-rollback";
import type { Attempt, Row } from "./placement-row";
import { postSchedule } from "./placement-schedule-step";
import { SETTLE_MS } from "./placement-timing";

const definiteFailure = async (
  run: PlacementRun,
  attempt: Attempt,
  written: Row | undefined,
  preClaim: Row | undefined,
  reason: DefiniteReason
): Promise<PlacementResult> => {
  const missing = reason === "not-found" && !run.minted;
  const verdict = await restorePrevious(
    run,
    attempt,
    written,
    preClaim,
    missing ? attempt.workoutId : undefined
  );
  if (verdict === "absent") return recordDeleted();
  if (verdict === "changed") return failed("guard-failed", true);
  if (reason === "not-found")
    return missing
      ? failed("library-missing", true)
      : failed("schedule-endpoint", false);
  return failed(reason, reason !== "schedule-rejected");
};

export const postAttempt = async (
  run: PlacementRun,
  claimed: Attempt,
  preClaim: Row | undefined,
  leftBehind: readonly string[]
): Promise<PlacementResult> => {
  const posted = await postSchedule(run, claimed);
  if (posted.kind === "absent") return recordDeleted();
  if (posted.kind === "busy") return failed("busy", true);
  const { attempt, written, answer, cls } = posted;
  const kind = attempt.previous ? "moved" : "scheduled";
  if (cls.kind === "ok" && answer.ok) {
    const placed = placedFrom(attempt, answer.workoutScheduleId);
    const verdict = await commitPlacement(run, attempt, placed, written);
    if (verdict === "absent") return recordDeleted(attempt.date);
    const behind = [
      ...leftBehind,
      ...unconfirmedLeftBehind(attempt.previous, placed),
    ];
    return finishPlacement(run, placed, kind, behind, true);
  }
  if (cls.kind === "definite")
    return definiteFailure(run, attempt, written, preClaim, cls.reason);
  await run.deps.sleep(SETTLE_MS);
  const resolved = await resolveAttempt(run, attempt);
  if (resolved.kind === "done") return resolved.result;
  const behind = [
    ...leftBehind,
    ...(resolved.many ? [attempt.date] : []),
    ...unconfirmedLeftBehind(attempt.previous, resolved.placed),
  ];
  return finishPlacement(run, resolved.placed, kind, behind);
};
