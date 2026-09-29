/**
 * An in-memory Garmin calendar behind GarminCalendarPort, with scripted
 * failures. Each queued `schedule` script decides the answer and whether
 * Garmin created the entry anyway (an ambiguous answer that committed);
 * `hideIds` makes `calendar-find` return no ids (A3 false), and an item's
 * own `hideId` hides only its id; with `lagMs`, `calendar-find` omits an
 * entry POSTed less than `lagMs` ago (A5 visibility lag). Every call is
 * logged in order, and `beforeAnswer` runs after Garmin decided (and created
 * the entry, if it does) but before the pipeline hears the answer — the
 * window in which another writer can land.
 */
import type {
  BridgeFailure,
  CalendarEntry,
  GarminCalendarPort,
} from "../application/garmin-placement/garmin-calendar-port";
import {
  type GarminScheduleId,
  type GarminWorkoutId,
  parseGarminScheduleId,
} from "../types/garmin-ledger";

export type CalendarItem = {
  id: GarminScheduleId;
  workoutId: GarminWorkoutId;
  date: string;
  /** `calendar-find` returns this entry without its id. */
  hideId?: boolean;
  /** When the POST created it (set only while `lagMs` is on). */
  postedAt?: number;
};
export type ScheduleScript = {
  answer?: BridgeFailure;
  /** Garmin created the entry (default: only when the answer is ok). */
  create?: boolean;
  /** A 2xx with no schedule id. */
  noId?: boolean;
};
export type CalendarCall =
  | { op: "schedule"; workoutId: string; date: string }
  | { op: "unschedule"; id: string }
  | { op: "find"; workoutId: string; date: string };

const month = (date: string) => date.slice(0, 7);

export const createFakeGarminCalendar = (firstId = 5000) => {
  let nextId = firstId;
  const items: CalendarItem[] = [];
  const calls: CalendarCall[] = [];
  const scripts = {
    schedule: [] as ScheduleScript[],
    unschedule: [] as BridgeFailure[],
    find: [] as BridgeFailure[],
  };
  const state = {
    hideIds: false,
    lagMs: 0,
    beforeAnswer: undefined as undefined | (() => Promise<void>),
  };
  const mint = (workoutId: GarminWorkoutId, date: string) => {
    const id = parseGarminScheduleId(String(nextId++)) as GarminScheduleId;
    const lag = state.lagMs > 0 ? { postedAt: Date.now() } : {};
    items.push({ id, workoutId, date, ...lag });
    return id;
  };
  const port: GarminCalendarPort = {
    schedule: async (workoutId, date) => {
      calls.push({ op: "schedule", workoutId, date });
      const script = scripts.schedule.shift() ?? {};
      const created = script.create ?? !script.answer;
      const id = created ? mint(workoutId, date) : undefined;
      await state.beforeAnswer?.();
      if (script.answer) return script.answer;
      return { ok: true, workoutScheduleId: script.noId ? null : (id ?? null) };
    },
    unschedule: async (id) => {
      calls.push({ op: "unschedule", id });
      const failure = scripts.unschedule.shift();
      if (failure) return failure;
      const at = items.findIndex((i) => i.id === id);
      if (at < 0) return { ok: false, status: 404 };
      items.splice(at, 1);
      return { ok: true };
    },
    find: async (workoutId, date) => {
      calls.push({ op: "find", workoutId, date });
      const failure = scripts.find.shift();
      if (failure) return failure;
      const visible = (i: CalendarItem) =>
        i.postedAt === undefined || Date.now() - i.postedAt >= state.lagMs;
      const entries: CalendarEntry[] = items
        .filter(
          (i) =>
            i.workoutId === workoutId &&
            month(i.date) === month(date) &&
            visible(i)
        )
        .map((i) => ({
          workoutScheduleId: state.hideIds || i.hideId ? null : i.id,
          date: i.date,
        }));
      return { ok: true, entries };
    },
  };
  const count = (op: CalendarCall["op"]) =>
    calls.filter((c) => c.op === op).length;
  return { port, items, calls, scripts, state, mint, count };
};

export type FakeGarminCalendar = ReturnType<typeof createFakeGarminCalendar>;
