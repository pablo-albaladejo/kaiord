/**
 * Reading Garmin's raw answers, which the Garmin Bridge hands over unread:
 * JSON bodies, the schedule id of a placement and the entries of one
 * workout in a month of the athlete's calendar. A month payload that is not
 * the expected shape is a failed read, never "found none": the App re-places
 * a workout only on a proven absence.
 */
import { readJson } from "../../bridge/connector-call";
import type { RawAnswer } from "../../bridge/thin-bridge-request";
import { bridgeAnswerRefusal } from "../../bridge/thin-bridge-request";
import { isIsoDate, toScheduleId } from "./garmin-ids";

export const readNothing = (): null => null;

export const readScheduleId = (
  answer: RawAnswer
): { workoutScheduleId: string | null } => {
  const data = readJson(answer) as { workoutScheduleId?: unknown } | null;
  return { workoutScheduleId: toScheduleId(data?.workoutScheduleId) };
};

const unreadable = () =>
  bridgeAnswerRefusal("unexpected-payload", { retryable: true });

type CalendarItem = {
  itemType?: unknown;
  workoutId?: unknown;
  id?: unknown;
  date?: unknown;
};

const parseMonth = (answer: RawAnswer): unknown => {
  try {
    return readJson(answer);
  } catch {
    throw unreadable();
  }
};

export const readWorkoutEntries =
  (workoutId: string) =>
  (answer: RawAnswer): { workoutScheduleId: string | null; date: string }[] => {
    const items = (parseMonth(answer) as { calendarItems?: unknown } | null)
      ?.calendarItems;
    if (!Array.isArray(items)) throw unreadable();
    const entries = (items as CalendarItem[]).filter(
      (item) =>
        item?.itemType === "workout" &&
        toScheduleId(item.workoutId) === workoutId
    );
    if (entries.some((item) => !isIsoDate(item.date))) throw unreadable();
    return entries.map((item) => ({
      workoutScheduleId: toScheduleId(item.id),
      date: item.date as string,
    }));
  };
