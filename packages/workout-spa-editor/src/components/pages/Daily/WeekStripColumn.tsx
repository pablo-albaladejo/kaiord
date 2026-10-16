import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { type Translate, useTranslate } from "../../../i18n/use-translate";
import { formatHms } from "../../../lib/workout-review";
import { narrowWeekdayName } from "../calendar-day-labels";
import type { DaySummary } from "./build-week-summary";
import type { WeekDay } from "./today-dates";
import { WeekStripMark } from "./WeekStripMark";

export type WeekStripColumnProps = {
  day: WeekDay;
  summary: DaySummary;
  onSelect: (iso: string) => void;
};

function ariaLabel(
  t: Translate,
  day: string,
  isRealToday: boolean,
  summary: DaySummary
): string {
  const today = isRealToday ? t("weekStrip.day.today") : "";
  if (summary.count === 0) return t("weekStrip.day.empty", { day, today });
  const bucket = summary.intensity
    ? t(`weekStrip.day.intensity.${summary.intensity}`)
    : "";
  const shown = summary.estimated
    ? t("weekStrip.day.estimated", { intensity: bucket })
    : bucket;
  const intensity = bucket ? `, ${shown}` : "";
  const duration =
    summary.durationSec !== null ? `, ${formatHms(summary.durationSec)}` : "";
  return t("weekStrip.day.planned", {
    day,
    today,
    count: summary.count,
    intensity,
    duration,
  });
}

export function WeekStripColumn({
  day,
  summary,
  onSelect,
}: WeekStripColumnProps) {
  const t = useTranslate("daily");
  const letter = narrowWeekdayName(day.iso, useActiveLocale());
  const label = `${letter} ${day.dayNumber}`;
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
      aria-label={ariaLabel(t, label, day.isRealToday, summary)}
      className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 transition-colors hover:bg-surface-elevated ${column}`}
    >
      <span className="text-[11px] font-semibold">{letter}</span>
      <span className={`text-[13px] font-bold tabular-nums ${number}`}>
        {day.dayNumber}
      </span>
      <span className="flex h-3 items-center justify-center">
        <WeekStripMark summary={summary} />
      </span>
    </button>
  );
}
