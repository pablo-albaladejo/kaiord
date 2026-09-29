/**
 * The end of a resolve that adopted nothing: the attempt stays
 * `attempting{posted:true}` and the athlete decides — unless they already
 * chose "Send anyway" and the gate has passed, which re-POSTs.
 */
import type { PlacementRun } from "./placement-deps";
import { gateOf } from "./placement-resolve";
import type { ResolveOutcome } from "./placement-resolve-step";
import { recordDeleted } from "./placement-result";
import { type Attempt, canConfirmAt } from "./placement-row";

export const undecided = async (
  run: PlacementRun,
  attempt: Attempt,
  inRun: boolean
): Promise<ResolveOutcome> => {
  const gate = gateOf(attempt);
  if (!inRun && run.sendAnyway && run.deps.now() >= gate)
    return { kind: "repost" };
  const row = await run.deps.ledgerRepo.findByNaturalKey(run.key);
  if (!row) return { kind: "done", result: recordDeleted(attempt.date) };
  const canConfirm = canConfirmAt(row, attempt.workoutId, attempt.date);
  return {
    kind: "done",
    result: {
      kind: "uncertain",
      date: attempt.date,
      canConfirm,
      sendAfter: gate,
    },
  };
};
