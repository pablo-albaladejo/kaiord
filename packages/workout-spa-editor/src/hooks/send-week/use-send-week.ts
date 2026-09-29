/**
 * The bulk "Send week" state for the calendar (design §3.7): start a run
 * over the visible week's candidates, cancel it between items, and retry
 * only what `retryCandidates` allows, keeping every other item's outcome.
 */
import { useCallback, useRef, useState } from "react";

import type { BulkPreflightFailure } from "../../application/garmin-bulk/bulk-preflight";
import { retryCandidates } from "../../application/garmin-bulk/bulk-retry";
import type { WeekPushCandidate } from "../../application/garmin-bulk/select-week-push-candidates";
import type { BulkOutcome } from "../../application/garmin-bulk/send-week-to-garmin";
import { runSendWeek, type SendWeekContext } from "./send-week-run";

export type SendWeekState =
  | { phase: "idle" }
  | { phase: "blocked"; failure: BulkPreflightFailure }
  | {
      phase: "running" | "done";
      outcomes: BulkOutcome[];
      total: number;
      /** The run stopped on a cancel before the rest of the week. */
      cancelled?: boolean;
    };

const upsert = (list: BulkOutcome[], outcome: BulkOutcome) =>
  list.some((o) => o.workoutId === outcome.workoutId)
    ? list.map((o) => (o.workoutId === outcome.workoutId ? outcome : o))
    : [...list, outcome];

export function useSendWeek(ctx: SendWeekContext) {
  const [state, setState] = useState<SendWeekState>({ phase: "idle" });
  const cancelled = useRef(false);

  const run = useCallback(
    async (candidates: readonly WeekPushCandidate[], base: BulkOutcome[]) => {
      cancelled.current = false;
      const total = base.length || candidates.length;
      let outcomes = base;
      setState({ phase: "running", outcomes, total });
      const result = await runSendWeek(ctx, candidates, {
        isCancelled: () => cancelled.current,
        onOutcome: (o) => {
          outcomes = upsert(outcomes, o);
          setState({ phase: "running", outcomes, total });
        },
      });
      if (typeof result === "string")
        return setState({ phase: "blocked", failure: result });
      setState({ phase: "done", outcomes, total, cancelled: result.cancelled });
    },
    [ctx]
  );

  const start = useCallback(
    (candidates: readonly WeekPushCandidate[]) => run(candidates, []),
    [run]
  );
  const retry = useCallback(() => {
    if (state.phase !== "done") return;
    const again = retryCandidates(state.outcomes, Date.now(), ctx.features);
    return run(again, state.outcomes);
  }, [state, ctx.features, run]);
  const cancel = useCallback(() => {
    cancelled.current = true;
  }, []);
  const close = useCallback(() => setState({ phase: "idle" }), []);

  return { state, start, retry, cancel, close };
}
