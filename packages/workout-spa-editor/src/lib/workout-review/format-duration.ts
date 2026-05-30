const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const PAD = 2;

/** "1h 04m" when ≥ 1h, else "45m". */
export function formatHms(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.round(total / SECONDS_PER_MINUTE);
  if (total >= SECONDS_PER_HOUR) {
    const hours = Math.floor(minutes / SECONDS_PER_MINUTE);
    const rem = minutes % SECONDS_PER_MINUTE;
    return `${hours}h ${String(rem).padStart(PAD, "0")}m`;
  }
  return `${minutes}m`;
}

/** "m:ss" with zero-padded seconds. */
export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(total / SECONDS_PER_MINUTE);
  const seconds = total % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(PAD, "0")}`;
}
