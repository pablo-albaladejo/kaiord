import type { WeekDay } from "./today-dates";

export type WeekStripColumnProps = {
  day: WeekDay;
  fraction: number;
  onSelect: (iso: string) => void;
};

const BAR_TRACK_HEIGHT = 40;
const MIN_BAR_PX = 3;
const PERCENT = 100;

export function WeekStripColumn({
  day,
  fraction,
  onSelect,
}: WeekStripColumnProps) {
  const barHeight = Math.max(
    MIN_BAR_PX,
    Math.round(fraction * BAR_TRACK_HEIGHT)
  );
  const column = day.isFocused
    ? "bg-sky-500/15 border border-sky-500 text-sky-400"
    : "text-slate-500";
  const bar = day.isFocused ? "bg-sky-400" : "bg-slate-600";
  const label = `Focus ${day.letter} ${day.dayNumber}${day.isRealToday ? " (today)" : ""}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(day.iso)}
      aria-pressed={day.isFocused}
      aria-current={day.isRealToday ? "date" : undefined}
      aria-label={label}
      className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 transition-colors hover:bg-slate-800 ${column}`}
    >
      <span className="text-[11px] font-semibold">{day.letter}</span>
      <span className="text-[13px] font-bold tabular-nums">
        {day.dayNumber}
      </span>
      <span
        aria-hidden="true"
        className={`h-1 w-1 rounded-full ${day.isRealToday ? "bg-sky-400" : "bg-transparent"}`}
      />
      <div
        className="flex w-full items-end justify-center"
        style={{ height: BAR_TRACK_HEIGHT }}
      >
        <div
          className={`w-1.5 rounded-full ${bar}`}
          style={{ height: `${(barHeight / BAR_TRACK_HEIGHT) * PERCENT}%` }}
        />
      </div>
    </button>
  );
}
