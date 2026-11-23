/**
 * The Garmin calendar port's answers: a refusal before anything is sent, a
 * failure carried from the envelope, an unreadable read, one entry.
 */
import type {
  BridgeFailure,
  CalendarEntry,
} from "../../../application/garmin-placement/garmin-calendar-port";
import {
  calendarDate,
  parseGarminScheduleId,
} from "../../../types/garmin-ledger";
import type { ExtensionResponse } from "../../bridge/bridge-transport";

export const UNREADABLE: BridgeFailure = {
  ok: false,
  error: "unexpected-payload",
  retryable: true,
};

export const refused = (error: string): BridgeFailure => ({
  ok: false,
  error,
  retryable: false,
});

export const failureOf = (res: ExtensionResponse): BridgeFailure => ({
  ok: false,
  ...(res.error !== undefined ? { error: res.error } : {}),
  ...(res.status !== undefined ? { status: res.status } : {}),
  ...(typeof res.retryable === "boolean" ? { retryable: res.retryable } : {}),
  ...(res.needsReauth ? { needsReauth: true } : {}),
  ...(res.delivered === false ? { delivered: false } : {}),
});

export const entryOf = (raw: unknown): CalendarEntry | undefined => {
  const item = raw as { workoutScheduleId?: unknown; date?: unknown } | null;
  if (!calendarDate.safeParse(item?.date).success) return undefined;
  const id = parseGarminScheduleId(item?.workoutScheduleId) ?? null;
  return { workoutScheduleId: id, date: item!.date as string };
};
