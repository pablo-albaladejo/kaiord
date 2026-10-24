/**
 * Where the week stands, in the three states that can still need the user.
 *
 * `doneAndMatched` counts sessions that were planned and executed and joined
 * to each other; `readyNotPushed` counts structured sessions that have not
 * reached a watch; `needsStructure` is the week's raw count. Anything else —
 * a plan the athlete has not got to yet — is not a state that needs anything,
 * so it is not reported (principle 2).
 */
import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CalendarBuckets } from "./calendar-buckets";

export type WeekStatus = {
  doneAndMatched: number;
  readyNotPushed: number;
  needsStructure: number;
};

/**
 * A match only joins a coach plan to a Kaiord workout; it is done once an
 * execution is recorded against it, or when the joined workout is itself the
 * execution (auto-match or a manual pick can pair the plan with an executed
 * record, whose `executedWorkoutIds` then stays empty). Raw pre-v12 rows may
 * lack the executed slot (see `collectMatchedWorkoutIds` in calendar-buckets).
 */
const isExecuted = (
  m: MatchedSessionWithMetadata,
  executedRefIds: ReadonlySet<string>
): boolean =>
  (m.match.executedWorkoutIds ?? []).length > 0 ||
  executedRefIds.has(m.match.workoutId);

const countExecuted = (buckets: CalendarBuckets): number =>
  Object.values(buckets.matchedByDay).reduce(
    (total, matches) =>
      total +
      matches.filter((m) => isExecuted(m, buckets.executedRefIds)).length,
    0
  );

const countReady = (byDay: Record<string, WorkoutRecord[]>): number =>
  Object.values(byDay).reduce(
    (total, records) =>
      total + records.filter((record) => record.state === "ready").length,
    0
  );

export function buildWeekStatus(
  buckets: CalendarBuckets,
  rawCount: number
): WeekStatus {
  return {
    doneAndMatched: countExecuted(buckets),
    readyNotPushed: countReady(buckets.soloActualsByDay),
    needsStructure: rawCount,
  };
}

export const weekStatusIsSilent = (status: WeekStatus): boolean =>
  status.doneAndMatched === 0 &&
  status.readyNotPushed === 0 &&
  status.needsStructure === 0;
