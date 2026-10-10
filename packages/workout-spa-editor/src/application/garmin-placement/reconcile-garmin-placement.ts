/**
 * Phase 2 (design §3.3 steps 4–9) for a record whose library workout is
 * confirmed: claim, then post, resolve a leftover attempt, or resolve an
 * `uncertain` (T5). An adoption lands a `Placed` and the claim runs again,
 * so a leftover for another date becomes a move in the same run; a leftover
 * proven absent goes back to its `previous` and the claim runs again too.
 */
import { claimPlacement, type Uncertain } from "./placement-claim";
import type { PlacementRun } from "./placement-deps";
import { finishPlacement } from "./placement-finish";
import { postAttempt } from "./placement-post-flow";
import { resolveAttempt } from "./placement-resolve-step";
import { resolveUncertain } from "./placement-resolve-uncertain";
import {
  failed,
  type PlacementResult,
  recordDeleted,
} from "./placement-result";
import { restorePrevious } from "./placement-rollback";
import { canConfirmAt } from "./placement-row";

/** A leftover resolve, then the claim of the desired placement. */
const MAX_ROUNDS = 3;
const REPOST = () => ({ kind: "repost" }) as const;

const stillUncertain = async (
  run: PlacementRun,
  u: Uncertain
): Promise<PlacementResult> => {
  const row = await run.deps.ledgerRepo.findByNaturalKey(run.key);
  if (!row) return recordDeleted();
  const canConfirm = canConfirmAt(row, u.workoutId, u.date);
  return { kind: "uncertain", date: u.date, canConfirm };
};

export const reconcileGarminPlacement = async (
  run: PlacementRun
): Promise<PlacementResult> => {
  let adopted = false;
  const leftBehind: string[] = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const claim = await claimPlacement(run);
    if (claim.kind === "absent") return recordDeleted();
    if (claim.kind === "unchanged")
      return finishPlacement(
        run,
        claim.placed,
        adopted ? "scheduled" : "unchanged",
        leftBehind
      );
    if (claim.kind === "claimed")
      return postAttempt(run, claim.attempt, claim.preClaim, leftBehind);
    if (claim.kind === "uncertain") {
      const t5 = await resolveUncertain(run, claim.placement);
      if (t5 === "undecided") return stillUncertain(run, claim.placement);
      if (t5.kind === "done") return t5.result;
      adopted = true;
      continue;
    }
    const resolved = await resolveAttempt(run, claim.attempt, REPOST);
    if (resolved.kind === "done") return resolved.result;
    if (resolved.kind === "repost") {
      // The leftover proved absent: it goes back to its `previous`, and the
      // next claim takes the run's own desired placement with one POST.
      const restored = await restorePrevious(run, claim.attempt);
      if (restored === "absent") return recordDeleted();
      if (restored === "changed") return failed("guard-failed", true);
      continue;
    }
    adopted = true;
    if (resolved.many) leftBehind.push(resolved.placed.date);
  }
  return failed("busy", true);
};
