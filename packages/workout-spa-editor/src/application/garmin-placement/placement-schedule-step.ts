/**
 * Steps 5–6 (design §3.3): mark the attempt `posted` under the guard, then
 * send the one `schedule` of the run and classify its answer. A failed
 * guard means another writer touched the row: no POST.
 */
import { classifyBridgeWrite, type WriteClass } from "./classify-bridge-write";
import type { ScheduleAnswer } from "./garmin-calendar-port";
import { isoAt, type PlacementRun } from "./placement-deps";
import { type Attempt, decide, isAttemptAt, type Row } from "./placement-row";

export type PostOutcome =
  | { kind: "absent" }
  | { kind: "busy" }
  | {
      kind: "answered";
      /** The attempt as step 5 rewrote it (`posted`, its new `at`). */
      attempt: Attempt;
      /** The row step 5 wrote: the base of a verbatim rollback. */
      written: Row | undefined;
      answer: ScheduleAnswer;
      cls: WriteClass;
    };

export const postSchedule = async (
  run: PlacementRun,
  claimed: Attempt
): Promise<PostOutcome> => {
  const posted: Attempt = {
    ...claimed,
    posted: true,
    at: isoAt(run.deps.now()),
  };
  const { verdict, after } = await decide(run.deps, run.key, (row) => {
    if (!row) return { verdict: "absent" as const };
    if (!isAttemptAt(row, claimed.at)) return { verdict: "busy" as const };
    return { write: { ...row, placement: posted }, verdict: "ok" as const };
  });
  if (verdict !== "ok") return { kind: verdict };
  const answer = await run.deps.calendar.schedule(
    posted.workoutId,
    posted.date
  );
  return {
    kind: "answered",
    attempt: posted,
    written: after,
    answer,
    cls: classifyBridgeWrite(answer),
  };
};
