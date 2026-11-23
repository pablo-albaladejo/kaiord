/**
 * A definite `schedule` failure: the claim goes back to `previous` (a 404
 * on an earlier push's library id also flags the record for a re-push),
 * and the reason is reported.
 */
import type { DefiniteReason } from "./classify-bridge-write";
import type { PlacementRun } from "./placement-deps";
import {
  failed,
  type PlacementResult,
  recordDeleted,
} from "./placement-result";
import { restorePrevious } from "./placement-rollback";
import type { Attempt, Row } from "./placement-row";

export const definiteFailure = async (
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
