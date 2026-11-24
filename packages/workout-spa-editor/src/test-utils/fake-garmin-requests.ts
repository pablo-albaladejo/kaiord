/**
 * The current Kaiord for Garmin (protocol 2) in front of the fake Garmin:
 * the App's `{ action: "request", method, path, body? }` is checked against
 * the extension's real closed list (`background.js` `ALLOWED`), refused
 * with nothing done when it is not listed, and otherwise turned into the
 * fake's own action, whose answer is handed back raw, as Garmin answers it:
 * the created workout, the schedule id as a number, a 204 for a delete, the
 * whole month of the calendar under `calendarItems`.
 */
import { closedListOf, isListed } from "./bridge-closed-list";

type Message = Record<string, unknown> & { action: string };
type Envelope = {
  ok: boolean;
  data?: unknown;
  error?: string;
  status?: number;
  retryable?: boolean;
};

const CLOSED_LIST = closedListOf("garmin-bridge");
const NOT_ALLOWED: Envelope = {
  ok: false,
  error: "Request not allowed",
  retryable: false,
};

const SCHEDULE = /^\/workout-service\/schedule\/(\d+)$/;
const LIBRARY_WORKOUT = /^\/workout-service\/workout\/(\d+)$/;
const MONTH = /^\/calendar-service\/year\/(\d{4})\/month\/(\d{1,2})$/;

/** The fake's own action for a listed request, as its log records it. */
export const toFakeAction = (m: Message): Message | undefined => {
  const method = String(m.method);
  const path = String(m.path);
  if (m.action !== "request" || !isListed(CLOSED_LIST, method, path))
    return undefined;
  const body = m.body as Record<string, unknown> | undefined;
  if (method === "POST" && path === "/workout-service/workout")
    return { action: "push", gcn: body };
  if (method === "GET" && path.startsWith("/workout-service/workouts"))
    return { action: "list" };
  const schedule = SCHEDULE.exec(path);
  if (schedule && method === "POST")
    return { action: "schedule", workoutId: schedule[1], date: body?.date };
  if (schedule && method === "DELETE")
    return { action: "unschedule", scheduleId: schedule[1] };
  const library = LIBRARY_WORKOUT.exec(path);
  if (library) return { action: "delete-workout", workoutId: library[1] };
  const month = MONTH.exec(path);
  if (month) {
    const m0 = String(Number(month[2]) + 1).padStart(2, "0");
    return { action: "calendar-month", month: `${month[1]}-${m0}` };
  }
  return undefined;
};

export const raw = (payload: unknown, status = 200): Envelope => ({
  ok: true,
  data: {
    status,
    contentType: payload === undefined ? "" : "application/json",
    body: payload === undefined ? "" : JSON.stringify(payload),
  },
});

export const notAllowed = (): Envelope => ({ ...NOT_ALLOWED });
