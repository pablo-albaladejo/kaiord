/**
 * Page-side Garmin library and calendar actions for the bridge stub: numeric
 * ids like Garmin's, `schedule` / `unschedule` over an in-memory calendar,
 * and `calendar-find` over the attempted date's month (as the bridge reads
 * it). Registered on `window.__GARMIN_STUB_ACTIONS__`; the state they mutate
 * is loaded and saved by `garmin-calendar-stub-page-script`.
 */
export type StubEntry = { id: number; workoutId: string; date: string };
export type StubCalendar = { nextId: number; entries: StubEntry[] };

export const installGarminStubActionsScript = (): void => {
  type Msg = Record<string, unknown>;
  const ok = (data: unknown) => ({ ok: true, protocolVersion: 1, data });
  const month = (date: unknown) => String(date).slice(0, 7);
  const notFound = {
    ok: false,
    protocolVersion: 1,
    error: "Unschedule failed",
    status: 404,
  };
  const actions: Record<string, (s: StubCalendar, m: Msg) => unknown> = {
    push: (s) => ok({ workoutId: s.nextId++ }),
    schedule: (s, m) => {
      const id = s.nextId++;
      const [workoutId, date] = [String(m.workoutId), String(m.date)];
      s.entries.push({ id, workoutId, date });
      return ok({ workoutScheduleId: id });
    },
    unschedule: (s, m) => {
      const at = s.entries.findIndex((e) => String(e.id) === m.scheduleId);
      if (at < 0) return notFound;
      s.entries.splice(at, 1);
      return ok(null);
    },
    "calendar-find": (s, m) =>
      ok(
        s.entries
          .filter((e) => e.workoutId === m.workoutId)
          .filter((e) => month(e.date) === month(m.date))
          .map((e) => ({ workoutScheduleId: String(e.id), date: e.date }))
      ),
  };
  (window as unknown as Record<string, unknown>).__GARMIN_STUB_ACTIONS__ =
    actions;
};
