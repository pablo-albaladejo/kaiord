/**
 * Duration → mark size for the WeekStrip. Short sessions render a smaller
 * mark, long sessions a larger one; an unknown duration keeps the default
 * medium size. Bounded to three steps so a single long day cannot dominate
 * the strip (honest scaling, not a continuous proportional bar).
 */
export type MarkSize = "sm" | "md" | "lg";

const SHORT_MAX_SEC = 1800; // < 30 min
const LONG_MIN_SEC = 4500; // >= 75 min

export function durationMarkSize(durationSec: number | null): MarkSize {
  if (durationSec === null) return "md";
  if (durationSec < SHORT_MAX_SEC) return "sm";
  if (durationSec >= LONG_MIN_SEC) return "lg";
  return "md";
}

export const GLYPH_SIZE: Record<MarkSize, string> = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-[12px]",
};

export const DOT_SIZE: Record<MarkSize, string> = {
  sm: "h-1 w-1",
  md: "h-1.5 w-1.5",
  lg: "h-2 w-2",
};
