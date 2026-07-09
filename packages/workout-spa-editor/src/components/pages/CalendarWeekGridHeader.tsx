/**
 * Sticky day-name header row for the calendar Grid view. Renders one
 * cell per day with the day name + date, today's pill, and the multi-
 * workout badge when a day has three or more activities.
 *
 * `position: sticky; top: 0` keeps the header visible while the user
 * scrolls a tall column body.
 */

import type { Locale } from "@kaiord/i18n";

import { useActiveLocale } from "../../i18n/LocaleProvider";
import { useTranslate } from "../../i18n/use-translate";
import { shortWeekdayName } from "./calendar-day-labels";

const TODAY_TINT = "bg-primary-50/40 dark:bg-primary-900/20";
const TODAY_PILL =
  "rounded-full bg-primary-100 px-1.5 text-primary-900 dark:bg-primary-900 dark:text-primary-100";

const MULTI_WORKOUT_THRESHOLD = 3;

const getDayLabel = (
  date: string,
  locale: Locale
): { name: string; num: number } => ({
  name: shortWeekdayName(date, locale),
  num: new Date(date + "T12:00:00Z").getUTCDate(),
});

export type CalendarWeekGridHeaderProps = {
  days: string[];
  todayDate: string;
  countFor: (date: string) => number;
};

export function CalendarWeekGridHeader({
  days,
  todayDate,
  countFor,
}: CalendarWeekGridHeaderProps) {
  const t = useTranslate("calendar");
  const locale = useActiveLocale();
  return (
    <div
      data-testid="calendar-week-grid-header"
      className="sticky top-0 z-10 mb-2 hidden bg-background sm:grid sm:grid-cols-7 sm:gap-2"
    >
      {days.map((date) => {
        const label = getDayLabel(date, locale);
        const isToday = date === todayDate;
        const count = countFor(date);
        return (
          <div
            key={date}
            data-testid={`calendar-week-grid-header-${date}`}
            data-today={isToday ? "true" : undefined}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground ${
              isToday ? TODAY_TINT : ""
            }`}
          >
            <span className={isToday ? TODAY_PILL : ""}>
              {label.name} {label.num}
            </span>
            {isToday && (
              <span className="sr-only">{t("gridHeader.todaySuffix")}</span>
            )}
            {count >= MULTI_WORKOUT_THRESHOLD && (
              <span
                data-testid={`multi-workout-badge-${date}`}
                className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {t("gridHeader.activities", { count })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
