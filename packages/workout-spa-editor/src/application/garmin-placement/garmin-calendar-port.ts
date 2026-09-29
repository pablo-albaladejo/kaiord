/**
 * Port — the Garmin calendar actions of the bridge (`schedule`,
 * `unschedule`, `calendar-find`). The adapter never throws: a failure is an
 * answer, classified by `classifyBridgeWrite`. The fields mirror the bridge
 * envelope (`error`, `status`, `retryable`, `needsReauth`) plus the SPA
 * transport's `delivered`.
 */
import type {
  GarminScheduleId,
  GarminWorkoutId,
} from "../../types/garmin-ledger";

export type BridgeFailure = {
  ok: false;
  status?: number;
  error?: string;
  retryable?: boolean;
  needsReauth?: boolean;
  /** `false`: the message never reached the extension (SPA timeout, gone). */
  delivered?: boolean;
};

/** One calendar entry of the workout; `null` id when A3 does not hold. */
export type CalendarEntry = {
  workoutScheduleId: GarminScheduleId | null;
  date: string;
};

export type ScheduleAnswer =
  { ok: true; workoutScheduleId: GarminScheduleId | null } | BridgeFailure;
export type UnscheduleAnswer = { ok: true } | BridgeFailure;
/** The entries of the workout in the month of `date`; never `[]` on a
    failed read. */
export type FindAnswer = { ok: true; entries: CalendarEntry[] } | BridgeFailure;

export type GarminCalendarPort = {
  schedule: (
    workoutId: GarminWorkoutId,
    date: string
  ) => Promise<ScheduleAnswer>;
  unschedule: (scheduleId: GarminScheduleId) => Promise<UnscheduleAnswer>;
  find: (workoutId: GarminWorkoutId, date: string) => Promise<FindAnswer>;
};
