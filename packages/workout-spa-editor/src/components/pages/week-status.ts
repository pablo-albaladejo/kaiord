/**
 * Where the week stands, in the three states that can still need the user.
 *
 * `doneAndMatched` counts sessions that were planned and executed and joined
 * to each other; `readyNotPushed` counts structured sessions that have not
 * reached a watch; `needsStructure` is the week's raw count. Anything else —
 * a plan the athlete has not got to yet — is not a state that needs anything,
 * so it is not reported (principle 2).
 */
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CalendarBuckets } from "./calendar-buckets";

export type WeekStatus = {
  doneAndMatched: number;
  readyNotPushed: number;
  needsStructure: number;
};

const countValues = <T>(byDay: Record<string, T[]>): number =>
  Object.values(byDay).reduce((total, entries) => total + entries.length, 0);

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
    doneAndMatched: countValues(buckets.matchedByDay),
    readyNotPushed: countReady(buckets.soloActualsByDay),
    needsStructure: rawCount,
  };
}

export const weekStatusIsSilent = (status: WeekStatus): boolean =>
  status.doneAndMatched === 0 &&
  status.readyNotPushed === 0 &&
  status.needsStructure === 0;
