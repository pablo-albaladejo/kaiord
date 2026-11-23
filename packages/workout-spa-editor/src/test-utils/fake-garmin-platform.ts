/**
 * A fake Garmin Connect that holds state, answering the App at the message
 * contract (`chrome.runtime.sendMessage` to the extension) exactly as Kaiord
 * for Garmin answers it: `push` creates a library workout, `schedule` /
 * `unschedule` write the calendar, `calendar-find` returns only the entries
 * of one workout in the month of a date, `list` the library. The calendar
 * may hold entries Kaiord did not create (the athlete's own workouts,
 * activities); the athlete can delete by hand. `crashOn` makes Garmin
 * commit a write and the App never hear the answer (a tab that died between
 * "created" and "recorded"); `calendarDown` fails the calendar read,
 * `downMonths` fails it for some months only (a partial read), and
 * `omitFromReads` makes the month read leave out a live entry for its next
 * N reads (Garmin's read lagging or flickering). The athlete can put a
 * library workout Kaiord created on another date (`placeLibraryWorkout`):
 * the same library workout id, an entry Kaiord did not create.
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
    /** Months (`YYYY-MM`) whose read fails while the others answer. */
    downMonths: new Set<string>(),
    /** Entry id → how many more month reads leave it out. */
    omitFromReads: new Map<number, number>(),
  };
  const visible = (id: number) => {
    const left = state.omitFromReads.get(id) ?? 0;
    if (left <= 0) return true;
    state.omitFromReads.set(id, left - 1);
    return false;
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
      case "calendar-find": {
        const read = month(String(m.date));
        if (state.calendarDown || state.downMonths.has(read))
          return fail(503, "Calendar read failed");
        const inMonth = calendar.filter(
          (i) =>
            i.itemType === "workout" &&
            String(i.workoutId) === m.workoutId &&
            month(i.date) === read
        );
        return {
          ok: true,
          data: inMonth
            .filter((i) => visible(i.id))
            .map((i) => ({ workoutScheduleId: String(i.id), date: i.date })),
        };
      }
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
    /** The athlete puts an existing library workout (one Kaiord created,
        for instance) on a date: an entry Kaiord did not create. */
    placeLibraryWorkout: (workoutId: number, date: string) => {
      const id = ids.schedule++;
      calendar.push({ id, itemType: "workout", workoutId, date });
      return id;
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
