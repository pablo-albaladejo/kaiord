/**
 * Clock-style durations ("4:30", "1:05:30") for inputs a person types.
 * The domain stays in seconds; these only cross the input boundary.
 */

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const BARE_MINUTES = /^\d+$/;
const MINUTES_SECONDS = /^(\d+):([0-5]\d)$/;
const HOURS_MINUTES_SECONDS = /^(\d+):([0-5]\d):([0-5]\d)$/;

/**
 * Seconds from "m:ss" or "h:mm:ss"; a bare number is whole minutes, which is
 * how people say a duration ("10" is ten minutes). Null when unreadable.
 */
export const parseClock = (text: string): number | null => {
  const typed = text.trim();
  if (BARE_MINUTES.test(typed)) return Number(typed) * SECONDS_PER_MINUTE;
  const hms = HOURS_MINUTES_SECONDS.exec(typed);
  if (hms)
    return (
      Number(hms[1]) * SECONDS_PER_HOUR +
      Number(hms[2]) * SECONDS_PER_MINUTE +
      Number(hms[3])
    );
  const ms = MINUTES_SECONDS.exec(typed);
  if (ms) return Number(ms[1]) * SECONDS_PER_MINUTE + Number(ms[2]);
  return null;
};

const pad = (n: number): string => n.toString().padStart(2, "0");

/** "m:ss", or "h:mm:ss" from one hour on, rounded to the second. */
export const formatClock = (totalSeconds: number): string => {
  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / SECONDS_PER_HOUR);
  const minutes = Math.floor((rounded % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = rounded % SECONDS_PER_MINUTE;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
};
