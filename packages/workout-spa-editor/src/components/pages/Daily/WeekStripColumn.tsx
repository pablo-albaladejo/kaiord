import { formatHms } from "../../../lib/workout-review";
import type { DaySummary } from "./build-week-summary";
import type { WeekDay } from "./today-dates";
import { WeekStripMark } from "./WeekStripMark";

export type WeekStripColumnProps = {
  day: WeekDay;
  summary: DaySummary;
  onSelect: (iso: string) => void;
};

function ariaLabel(day: WeekDay, summary: DaySummary): string {
  const today = day.isRealToday ? " (today)" : "";
  if (summary.count === 0) {
    return `Focus ${day.letter} ${day.dayNumber}${today}, nothing planned`;
  }
  const intensity = summary.intensity
    ? `, ${summary.intensity}${summary.estimated ? " estimated" : ""}`
    : "";
  const duration =
    summary.durationSec !== null ? `, ${formatHms(summary.durationSec)}` : "";
  return `Focus ${day.letter} ${day.dayNumber}${today}, ${summary.count} planned${intensity}${duration}`;
}

export function WeekStripColumn({
  day,
  summary,
  onSelect,
}: WeekStripColumnProps) {
  const column = day.isFocused
    ? "bg-accent/15 border border-accent text-accent"
    : "text-ink-muted";
  const number = day.isRealToday
    ? "flex h-5 w-5 items-center justify-center rounded-full border border-accent text-accent"
    : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(day.iso)}
      aria-pressed={day.isFocused}
      aria-current={day.isRealToday ? "date" : undefined}
      aria-label={ariaLabel(day, summary)}
      className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 transition-colors hover:bg-surface-elevated ${column}`}
    >
      <span className="text-[11px] font-semibold">{day.letter}</span>
      <span className={`text-[13px] font-bold tabular-nums ${number}`}>
        {day.dayNumber}
      </span>
      <span className="flex h-3 items-center justify-center">
        <WeekStripMark summary={summary} />
      </span>
    </button>
  );
}
