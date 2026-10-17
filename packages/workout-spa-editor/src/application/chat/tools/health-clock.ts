/**
 * Start/end of a sleep night or stress episode as local `HH:MM` clock times.
 *
 * The stored value is an ISO instant written upstream. Anything that does
 * not start as a full ISO date-time is dropped before `Date` sees it (so
 * `"1"`, a bare day, or an RFC 2822 string never becomes a clock), and only
 * the hour and minute derived from it leave this module.
 */
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const pad = (n: number): string => String(n).padStart(2, "0");

export const localClockOf = (value: unknown): string | null => {
  if (typeof value !== "string" || !ISO_DATE_TIME.test(value)) return null;
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  return `${pad(instant.getHours())}:${pad(instant.getMinutes())}`;
};

export const clockWindowOf = (
  krd: Record<string, unknown>
): Record<string, string> => {
  const start = localClockOf(krd.startTime);
  const end = localClockOf(krd.endTime);
  return {
    ...(start === null ? {} : { startTime: start }),
    ...(end === null ? {} : { endTime: end }),
  };
};
