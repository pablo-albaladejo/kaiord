/**
 * GarminCalendarPort over the Garmin Bridge: the schedule POST and DELETE
 * and the month read through `request` (protocol 2), or the legacy
 * `schedule`, `unschedule` and `calendar-find` actions (protocol 1). Each
 * waits `SPA_ACTION_TIMEOUT_MS`, longer than the bridge's own deadline, so
 * the App hears the bridge's answer before it gives up. Never throws: a
 * failure is the envelope's fields, an invalid id or date is refused before
 * anything is sent, and an answer that is not the expected shape is a
 * failed read, never "found 0".
 */
import type {
  CalendarEntry,
  GarminCalendarPort,
} from "../../../application/garmin-placement/garmin-calendar-port";
import { SPA_ACTION_TIMEOUT_MS } from "../../../application/garmin-placement/placement-timing";
import { parseGarminScheduleId } from "../../../types/garmin-ledger";
import { sendBridgeMessage } from "../../bridge/bridge-transport";
import { callConnector, type ConnectorSend } from "../../bridge/connector-call";
import type { BridgeCall } from "../../bridge/thin-bridge-request";
import {
  entryOf,
  failureOf,
  refused,
  UNREADABLE,
} from "./garmin-calendar-answers";
import { isGarminId, isIsoDate } from "./garmin-ids";
import { garminMonthPath, garminSchedulePath } from "./garmin-paths";
import {
  readNothing,
  readScheduleId,
  readWorkoutEntries,
} from "./read-garmin-answers";

export const createGarminCalendarPort = (
  extensionId: () => string,
  send: ConnectorSend = sendBridgeMessage
): GarminCalendarPort => {
  const call = <T>(c: BridgeCall<T>) =>
    callConnector(extensionId(), c, SPA_ACTION_TIMEOUT_MS, send);
  return {
    schedule: async (workoutId, date) => {
      if (!isGarminId(workoutId)) return refused("Invalid workoutId");
      if (!isIsoDate(date)) return refused("Invalid date");
      const res = await call({
        method: "POST",
        path: garminSchedulePath(workoutId),
        body: { date },
        legacy: { action: "schedule", workoutId, date },
        read: readScheduleId,
      });
      if (!res.ok) return failureOf(res);
      const data = res.data as { workoutScheduleId?: unknown } | null;
      const id = parseGarminScheduleId(data?.workoutScheduleId) ?? null;
      return { ok: true, workoutScheduleId: id };
    },
    unschedule: async (scheduleId) => {
      if (!isGarminId(scheduleId)) return refused("Invalid scheduleId");
      const res = await call({
        method: "DELETE",
        path: garminSchedulePath(scheduleId),
        legacy: { action: "unschedule", scheduleId },
        read: readNothing,
      });
      return res.ok ? { ok: true } : failureOf(res);
    },
    find: async (workoutId, date) => {
      if (!isGarminId(workoutId)) return refused("Invalid workoutId");
      if (!isIsoDate(date)) return refused("Invalid date");
      const res = await call({
        method: "GET",
        path: garminMonthPath(date),
        legacy: { action: "calendar-find", workoutId, date },
        read: readWorkoutEntries(workoutId),
      });
      if (!res.ok) return failureOf(res);
      if (!Array.isArray(res.data)) return UNREADABLE;
      const entries = res.data.map(entryOf);
      if (entries.some((e) => !e)) return UNREADABLE;
      return { ok: true, entries: entries as CalendarEntry[] };
    },
  };
};
