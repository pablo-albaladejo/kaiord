/**
 * Pace format utilities
 *
 * Convert between seconds and mm:ss display format.
 */

export function secondsToMmSs(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function mmSsToSeconds(value: string): number | undefined {
  const parts = value.split(":");
  if (parts.length !== 2) return undefined;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs)) return undefined;
  return mins * 60 + secs;
}
