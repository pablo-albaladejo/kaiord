import type { PaceUnit } from "../../types/sport-zones";

const SECONDS_PER_MINUTE = 60;

/** Formats a pace given in seconds as "m:ss" (e.g. 245 → "4:05"). */
export function formatPace(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const remainder = seconds % SECONDS_PER_MINUTE;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

/** Human suffix for a pace unit. */
export function paceUnitLabel(unit: PaceUnit): string {
  return unit === "min_per_100m" ? "/100m" : "/km";
}
