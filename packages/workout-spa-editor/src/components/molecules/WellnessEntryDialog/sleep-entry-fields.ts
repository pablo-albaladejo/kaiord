import type { ManualSleepEntry } from "../../../application/health/manual-sleep-payload.converter";
import { resolveSleepDuration } from "../../../application/health/manual-sleep-payload.converter";

export type SleepFields = {
  hours: string;
  score: string;
  bedtime: string;
  wakeTime: string;
};

export type SleepFieldsError = "invalidHours" | "needsDuration" | "mismatch";

export type SleepFieldsResult =
  { entry?: ManualSleepEntry } | { error: SleepFieldsError };

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const NOON_HOUR = 12;
const MAX_SLEEP_SECONDS = 24 * SECONDS_PER_HOUR;
const HOURS_PATTERN = /^(\d{1,2})(?::([0-5]\d))?$/;

/** "7:30" or "7" → seconds; `null` unless it is a non-empty night of h:mm. */
export const parseSleepHours = (raw: string): number | null => {
  const match = HOURS_PATTERN.exec(raw.trim());
  if (!match) return null;
  const minutes = Number(match[2] ?? 0);
  const seconds =
    Number(match[1]) * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE;
  return seconds > 0 && seconds <= MAX_SLEEP_SECONDS ? seconds : null;
};

/** A local clock time on `day`, or on the day before. */
const localIso = (day: string, time: string, dayBefore: boolean): string => {
  // A date-time string without an offset is parsed as local time.
  const at = new Date(`${day}T${time}:00`);
  if (dayBefore) at.setDate(at.getDate() - 1);
  return at.toISOString();
};

/**
 * The wake time falls on `day`. The bedtime falls on the evening before when
 * it is not earlier than the wake time (or, with no wake time, from noon on).
 */
const clockTimes = (day: string, bedtime: string, wakeTime: string) => {
  const bedBefore = wakeTime
    ? bedtime >= wakeTime
    : Number(bedtime.split(":")[0]) >= NOON_HOUR;
  return {
    ...(bedtime ? { startTime: localIso(day, bedtime, bedBefore) } : {}),
    ...(wakeTime ? { endTime: localIso(day, wakeTime, false) } : {}),
  };
};

export const collectSleepFields = (
  fields: SleepFields,
  day: string
): SleepFieldsResult => {
  const hours = fields.hours.trim();
  const durationSeconds = hours === "" ? undefined : parseSleepHours(hours);
  if (durationSeconds === null) return { error: "invalidHours" };
  const score = fields.score.trim() === "" ? undefined : Number(fields.score);
  const { bedtime, wakeTime } = fields;
  if (durationSeconds === undefined && (bedtime === "") !== (wakeTime === ""))
    return { error: "needsDuration" };
  const entry: ManualSleepEntry = {
    ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    ...(score !== undefined ? { score } : {}),
    ...clockTimes(day, bedtime, wakeTime),
  };
  if (Object.keys(entry).length === 0) return {};
  if (resolveSleepDuration(entry) === null) return { error: "mismatch" };
  return { entry };
};
