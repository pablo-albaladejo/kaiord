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

const FILL: Record<IntensityBucket, string> = {
  easy: "bg-sky-500/40",
  moderate: "bg-sky-500/70",
  hard: "bg-sky-400",
};
const RING: Record<IntensityBucket, string> = {
  easy: "border border-sky-500/40",
  moderate: "border border-sky-500/70",
  hard: "border border-sky-400",
};
const OPACITY: Record<IntensityBucket, string> = {
  easy: "opacity-50",
  moderate: "opacity-75",
  hard: "opacity-100",
};

function dotClass(summary: DaySummary): string {
  if (!summary.intensity) return "border border-slate-500";
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
        className="h-px w-3 rounded-full bg-slate-700"
      />
    );
  }
  const size = durationMarkSize(summary.durationSec);
  const count = summary.count >= 2 && (
    <span className="text-[9px] font-semibold leading-none text-slate-500">
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
