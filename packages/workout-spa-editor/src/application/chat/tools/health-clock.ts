/**
 * Start/end of a sleep night or stress episode as local `HH:MM` clock times.
 *
 * The stored value is an ISO instant written upstream; only the two digits
 * of hour and minute the runtime derives from it leave this module, so an
 * arbitrary string in that field reaches the model as nothing at all.
 */
const HH_MM = /^\d{2}:\d{2}$/;

const pad = (n: number): string => String(n).padStart(2, "0");

export const localClockOf = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  const clock = `${pad(instant.getHours())}:${pad(instant.getMinutes())}`;
  return HH_MM.test(clock) ? clock : null;
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
