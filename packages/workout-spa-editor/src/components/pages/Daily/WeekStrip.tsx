import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { calendarWeekHref } from "../../../routing/calendar-week-href";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { DaySummary, WeekSummary } from "./build-week-summary";
import type { WeekDay } from "./today-dates";
import { WeekStripColumn } from "./WeekStripColumn";

export type WeekStripProps = {
  days: WeekDay[];
  weekSummary: WeekSummary;
  onSelectDay: (iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

const ARROW =
  "flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-elevated";

const EMPTY: DaySummary = {
  count: 0,
  intensity: null,
  estimated: false,
  sport: null,
  durationSec: null,
};

export function WeekStrip(props: WeekStripProps) {
  const t = useTranslate("daily");
  const { days, weekSummary, onSelectDay } = props;
  const calendarHref =
    days.length > 0 ? calendarWeekHref(days[0]!.iso) : "/calendar";

  return (
    <div
      data-testid="daily-week-strip"
      className="rounded-lg bg-surface border-edge p-3"
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={t("weekStrip.previousDay")}
          onClick={props.onPrev}
          className={ARROW}
        >
          <Icon icon={ICON_MAP.chevL} size="sm" color="inherit" />
        </button>
        {days.map((day) => (
          <WeekStripColumn
            key={day.iso}
            day={day}
            summary={weekSummary[day.iso] ?? EMPTY}
            onSelect={onSelectDay}
          />
        ))}
        <button
          type="button"
          aria-label={t("weekStrip.nextDay")}
          onClick={props.onNext}
          className={ARROW}
        >
          <Icon icon={ICON_MAP.chevR} size="sm" color="inherit" />
        </button>
      </div>
      <div className="mt-2 flex justify-end">
        <Link
          href={calendarHref}
          aria-label={t("weekStrip.openInCalendar")}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-ink-muted transition-colors hover:bg-surface-elevated"
        >
          <Icon icon={ICON_MAP.calendar} size="sm" color="inherit" />
          {t("weekStrip.calendar")}
        </Link>
      </div>
    </div>
  );
}
