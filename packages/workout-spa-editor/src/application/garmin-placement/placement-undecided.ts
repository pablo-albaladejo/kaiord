/**
 * The end of a resolve that adopted nothing: the attempt stays
 * `attempting{posted:true}` and the athlete decides — unless they already
 * chose "Send anyway" and the gate has passed, which re-POSTs (`repost`,
 * a leftover's resolve only; a run never re-POSTs its own attempt).
 */
import type { PlacementRun } from "./placement-deps";
import { gateOf } from "./placement-resolve";
import type { Settled } from "./placement-resolve-step";
import { recordDeleted } from "./placement-result";
import { type Attempt, canConfirmAt } from "./placement-row";

export const undecided = async <R = never>(
  run: PlacementRun,
  attempt: Attempt,
  repost?: () => R
): Promise<Settled | R> => {
  const gate = gateOf(attempt);
  if (repost && run.sendAnyway && run.deps.now() >= gate) return repost();
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
