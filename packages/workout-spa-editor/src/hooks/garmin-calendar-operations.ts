/**
 * GarminCalendarPort over the bridge's `schedule`, `unschedule` and
 * `calendar-find` actions. Each waits `SPA_ACTION_TIMEOUT_MS`, longer than
 * the bridge's own deadline, so the SPA hears the bridge's answer before
 * it gives up. Never throws: a failure is the envelope's fields, and an
 * answer that is not the expected shape is a failed read, never "found 0".
 */
import type {
  BridgeFailure,
  CalendarEntry,
  GarminCalendarPort,
} from "../application/garmin-placement/garmin-calendar-port";
import { SPA_ACTION_TIMEOUT_MS } from "../application/garmin-placement/placement-timing";
import { sendMessage } from "../store/garmin-extension-transport";
import { calendarDate, parseGarminScheduleId } from "../types/garmin-ledger";

type Send = typeof sendMessage;

const UNREADABLE: BridgeFailure = {
  ok: false,
  error: "unexpected-payload",
  retryable: true,
};

const failureOf = (res: Awaited<ReturnType<Send>>): BridgeFailure => ({
  ok: false,
  ...(res.error !== undefined ? { error: res.error } : {}),
  ...(res.status !== undefined ? { status: res.status } : {}),
  ...(typeof res.retryable === "boolean" ? { retryable: res.retryable } : {}),
  ...(res.needsReauth ? { needsReauth: true } : {}),
  ...(res.delivered === false ? { delivered: false } : {}),
});

const entryOf = (raw: unknown): CalendarEntry | undefined => {
  const item = raw as { workoutScheduleId?: unknown; date?: unknown } | null;
  if (!calendarDate.safeParse(item?.date).success) return undefined;
  const id = parseGarminScheduleId(item?.workoutScheduleId) ?? null;
  return { workoutScheduleId: id, date: item!.date as string };
};

export const createGarminCalendarPort = (
  extensionId: () => string,
  send: Send = sendMessage
): GarminCalendarPort => {
  const call = (message: Record<string, unknown>) =>
    send(extensionId(), message, SPA_ACTION_TIMEOUT_MS);
  return {
    schedule: async (workoutId, date) => {
      const res = await call({ action: "schedule", workoutId, date });
      if (!res.ok) return failureOf(res);
      const data = res.data as { workoutScheduleId?: unknown } | null;
      const id = parseGarminScheduleId(data?.workoutScheduleId) ?? null;
      return { ok: true, workoutScheduleId: id };
    },
    unschedule: async (scheduleId) => {
      const res = await call({ action: "unschedule", scheduleId });
      return res.ok ? { ok: true } : failureOf(res);
    },
    find: async (workoutId, date) => {
      const res = await call({ action: "calendar-find", workoutId, date });
      if (!res.ok) return failureOf(res);
      if (!Array.isArray(res.data)) return UNREADABLE;
      const entries = res.data.map(entryOf);
      if (entries.some((e) => !e)) return UNREADABLE;
      return { ok: true, entries: entries as CalendarEntry[] };
    },
  };
};
