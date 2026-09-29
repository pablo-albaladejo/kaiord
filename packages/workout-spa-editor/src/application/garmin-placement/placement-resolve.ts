/**
 * R2 and the gate (design §3.4), pure: what a `calendar-find` read says
 * about an `attempting{posted:true}`. With A3, only an entry the ledger
 * does not know can be ours, and absence counts only after the gate;
 * without A3 a count is never absence (MUST-C).
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { CalendarEntry } from "./garmin-calendar-port";
import { type Attempt, canConfirmAt, type Row } from "./placement-row";
import { POST_GATE_MS } from "./placement-timing";

export type ResolveDecision =
  | { kind: "adopt"; placed: GarminPlaced; many: boolean }
  | { kind: "repost" }
  | { kind: "settling"; retryAfter: number }
  | { kind: "uncertain" };

export const gateOf = (attempt: Attempt) =>
  Date.parse(attempt.at) + POST_GATE_MS;

const knownIds = (attempt: Attempt, row: Row) =>
  new Set<string>([
    ...(attempt.previous?.kind === "scheduled"
      ? [attempt.previous.workoutScheduleId]
      : []),
    ...(row.removalQueue ?? []).map((e) => e.workoutScheduleId),
  ]);

const byIdOrder = (x: string, y: string) =>
  x.length - y.length || (x < y ? -1 : 1);

export const decideResolve = (
  attempt: Attempt,
  row: Row,
  found: CalendarEntry[],
  scheduleIdsInFind: boolean,
  readStartedAt: number
): ResolveDecision => {
  const atDate = found.filter((e) => e.date === attempt.date);
  const { workoutId, date } = attempt;
  if (scheduleIdsInFind && found.every((e) => e.workoutScheduleId)) {
    const known = knownIds(attempt, row);
    const candidates = atDate
      .flatMap((e) => (e.workoutScheduleId ? [e.workoutScheduleId] : []))
      .filter((id) => !known.has(id))
      .sort(byIdOrder);
    const [lowest] = candidates;
    if (lowest) {
      const placed = {
        kind: "scheduled",
        workoutScheduleId: lowest,
        workoutId,
        date,
      } as const;
      return { kind: "adopt", placed, many: candidates.length > 1 };
    }
    const gate = gateOf(attempt);
    return readStartedAt >= gate
      ? { kind: "repost" }
      : { kind: "settling", retryAfter: gate };
  }
  if (atDate.length === 0 || !canConfirmAt(row, workoutId, date))
    return { kind: "uncertain" };
  const placed: GarminPlaced = {
    kind: "unconfirmed",
    workoutId,
    date,
    supersedes: [],
  };
  return { kind: "adopt", placed, many: atDate.length > 1 };
};
