/**
 * The bulk "Send week" state for the calendar (design §3.7): start a run
 * over the visible week's candidates, cancel it between items, and retry
 * only what `retryCandidates` allows, keeping every other item's outcome.
 * Closing (a week change) or unmounting ends the run between items and
 * silences it, so its panel never comes back.
 */
import { useCallback, useEffect, useRef, useState } from "react";

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
  // Each run's id; a closed or unmounted run is no longer current.
  const runId = useRef(0);
  useEffect(() => {
    const ids = runId;
    return () => void ids.current++;
  }, []);

  const run = useCallback(
    async (candidates: readonly WeekPushCandidate[], base: BulkOutcome[]) => {
      const id = ++runId.current;
      const stale = () => runId.current !== id;
      cancelled.current = false;
      const total = base.length || candidates.length;
      let outcomes = base;
      setState({ phase: "running", outcomes, total });
      const result = await runSendWeek(ctx, candidates, {
        isCancelled: () => cancelled.current || stale(),
        onOutcome: (o) => {
          if (stale()) return;
          outcomes = upsert(outcomes, o);
          setState({ phase: "running", outcomes, total });
        },
      });
      if (stale()) return;
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
  const close = useCallback(() => {
    runId.current++;
    setState({ phase: "idle" });
  }, []);

  return { state, start, retry, cancel, close };
}
