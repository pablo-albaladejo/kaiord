/**
 * A fake Garmin Connect that holds state, answering the App at the message
 * contract (`chrome.runtime.sendMessage` to the extension) exactly as Kaiord
 * for Garmin answers it: `push` creates a library workout, `schedule` /
 * `unschedule` write the calendar, `calendar-find` returns only the entries
 * of one workout in the month of a date, `list` the library. The calendar
 * may hold entries Kaiord did not create (the athlete's own workouts,
 * activities); the athlete can delete by hand. `crashOn` makes Garmin
 * commit a write and the App never hear the answer (a tab that died between
 * "created" and "recorded"); `calendarDown` fails the calendar read.
 */
import { vi } from "vitest";

export type FakeLibraryWorkout = { workoutId: number; workoutName: string };
export type FakeCalendarItem = {
  id: number;
  itemType: string;
  workoutId: number | null;
  date: string;
  title?: string;
};
type Message = Record<string, unknown> & { action: string };
type Envelope = {
  ok: boolean;
  data?: unknown;
  error?: string;
  status?: number;
};

const month = (date: string) => date.slice(0, 7);

export const createFakeGarminPlatform = () => {
  const library: FakeLibraryWorkout[] = [];
  const calendar: FakeCalendarItem[] = [];
  const log: Message[] = [];
  const ids = { workout: 1_711_000_000, schedule: 1_792_000_000 };
  const state = {
    crashOn: undefined as string | undefined,
    /** The calendar month read fails (Garmin not answering). */
    calendarDown: false,
  };

  const fail = (status: number, error: string): Envelope => ({
    ok: false,
    status,
    error: `${error}: ${status}`,
  });
  const hasWorkout = (id: number) => library.some((w) => w.workoutId === id);

  const answer = (m: Message): Envelope => {
    switch (m.action) {
      case "ping":
        return { ok: true, data: { features: [] } };
      case "list":
        return { ok: true, data: library.map((w) => ({ ...w })) };
      case "push": {
        const gcn = m.gcn as { workoutName?: string };
        const w = {
          workoutId: ids.workout++,
          workoutName: gcn.workoutName ?? "",
        };
        library.push(w);
        return { ok: true, data: { ...w } };
      }
      case "schedule": {
        const workoutId = Number(m.workoutId);
        if (!hasWorkout(workoutId)) return fail(404, "Schedule failed");
        const id = ids.schedule++;
        const date = String(m.date);
        calendar.push({ id, itemType: "workout", workoutId, date });
        return { ok: true, data: { workoutScheduleId: String(id) } };
      }
      case "unschedule": {
        const at = calendar.findIndex(
          (i) => i.itemType === "workout" && String(i.id) === m.scheduleId
        );
        if (at < 0) return fail(404, "Unschedule failed");
        calendar.splice(at, 1);
        return { ok: true, data: null };
      }
      case "calendar-find":
        if (state.calendarDown) return fail(503, "Calendar read failed");
        return {
          ok: true,
          data: calendar
            .filter(
              (i) =>
                i.itemType === "workout" &&
                String(i.workoutId) === m.workoutId &&
                month(i.date) === month(String(m.date))
            )
            .map((i) => ({ workoutScheduleId: String(i.id), date: i.date })),
        };
      default:
        return { ok: false, error: `Unknown action: ${m.action}` };
    }
  };

  const sendMessage = (
    _extensionId: string,
    message: Message,
    callback: (raw: unknown) => void
  ) => {
    log.push(message);
    const envelope = answer(message);
    if (state.crashOn === message.action) {
      state.crashOn = undefined;
      return; // Garmin committed; the App never hears back.
    }
    queueMicrotask(() => callback({ protocolVersion: 1, ...envelope }));
  };

  const install = () =>
    vi.stubGlobal("chrome", { runtime: { sendMessage, lastError: undefined } });

  /** The athlete's own entries and actions in Garmin Connect. */
  const athlete = {
    addOwnWorkout: (workoutName: string, date?: string) => {
      const w = { workoutId: ids.workout++, workoutName };
      library.push(w);
      if (date)
        calendar.push({
          id: ids.schedule++,
          itemType: "workout",
          workoutId: w.workoutId,
          date,
        });
      return w;
    },
    addActivity: (date: string, title: string) =>
      calendar.push({
        id: ids.schedule++,
        itemType: "activity",
        workoutId: null,
        date,
        title,
      }),
    deleteEntry: (id: number) =>
      calendar.splice(
        calendar.findIndex((i) => i.id === id),
        1
      ),
    /** Deleting a library workout takes its calendar entries with it. */
    deleteWorkout: (workoutId: number) => {
      library.splice(
        library.findIndex((w) => w.workoutId === workoutId),
        1
      );
      for (let i = calendar.length - 1; i >= 0; i--)
        if (calendar[i].workoutId === workoutId) calendar.splice(i, 1);
    },
  };

  const entriesOf = (workoutName: string) => {
    const owned = new Set(
      library
        .filter((w) => w.workoutName === workoutName)
        .map((w) => w.workoutId)
    );
    return calendar.filter(
      (i) => i.workoutId !== null && owned.has(i.workoutId)
    );
  };
  const count = (action: string) =>
    log.filter((m) => m.action === action).length;

  return {
    library,
    calendar,
    log,
    state,
    athlete,
    install,
    entriesOf,
    count,
  };
};

export type FakeGarminPlatform = ReturnType<typeof createFakeGarminPlatform>;
