/**
 * Per-day mark for a WeekStrip column: a faint hairline when the day is empty;
 * otherwise the day's sport glyph (emoji) when one is known — dimmed by
 * intensity (easy/moderate/hard, fainter when presence-only) — falling back to
 * an intensity-tinted dot when no sport is available. The mark grows with the
 * day's measured duration (short/medium/long). A small count is appended when
 * the day holds 2+ entries.
 */
import type { DaySummary, IntensityBucket } from "./build-week-summary";
import { DOT_SIZE, durationMarkSize, GLYPH_SIZE } from "./mark-size";

/* Ink at three opacities, not three tints of one hue: the five hues belong to
   training zones, and the strip's channel here is intensity, not zone. A
   measured day is filled; an estimated one is only outlined. */
const FILL: Record<IntensityBucket, string> = {
  easy: "bg-ink-strong/35",
  moderate: "bg-ink-strong/65",
  hard: "bg-ink-strong",
};
const RING: Record<IntensityBucket, string> = {
  easy: "border border-ink-strong/35",
  moderate: "border border-ink-strong/65",
  hard: "border border-ink-strong",
};
const OPACITY: Record<IntensityBucket, string> = {
  easy: "opacity-50",
  moderate: "opacity-75",
  hard: "opacity-100",
};

function dotClass(summary: DaySummary): string {
  if (!summary.intensity) return "border border-edge";
  return summary.estimated ? RING[summary.intensity] : FILL[summary.intensity];
}

function glyphOpacity(summary: DaySummary): string {
  return summary.intensity ? OPACITY[summary.intensity] : "opacity-40";
}

export function WeekStripMark({ summary }: { summary: DaySummary }) {
  if (summary.count === 0) {
    return (
      <span
        data-testid="weekstrip-empty"
        aria-hidden="true"
        className="h-px w-3 rounded-full bg-edge"
      />
    );
  }
  const size = durationMarkSize(summary.durationSec);
  const count = summary.count >= 2 && (
    <span className="text-[9px] font-semibold leading-none text-ink-muted">
      {summary.count}
    </span>
  );
  const mark = summary.sport ? (
    <span
      data-testid="weekstrip-sport"
      aria-hidden="true"
      className={`${GLYPH_SIZE[size]} leading-none ${glyphOpacity(summary)}`}
    >
      {summary.sport}
    </span>
  ) : (
    <span
      data-testid="weekstrip-dot"
      aria-hidden="true"
      className={`${DOT_SIZE[size]} rounded-full ${dotClass(summary)}`}
    />
  );
  return (
    <span className="flex items-center gap-0.5">
      {mark}
      {count}
    </span>
  );
}
