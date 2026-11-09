import type { WorkoutRecord } from "../types/calendar-record";

/**
 * One coaching activity's matched/solo status as the coaching dialog renders
 * it: `solo` when no `SessionMatch` row exists, `matched` with the executed
 * workout otherwise.
 */
export type ActivityMatchState =
  | { kind: "solo" }
  | { kind: "matched"; matchId: string; workout: WorkoutRecord };
