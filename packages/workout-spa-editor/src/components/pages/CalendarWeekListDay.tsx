/** A single day section within the calendar week List view. */

import type { Locale } from "@kaiord/i18n";

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import { useActiveLocale } from "../../i18n/LocaleProvider";
import { useTranslate } from "../../i18n/use-translate";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { DayWellness } from "../../types/health/day-wellness";
import { renderDayCards } from "../molecules/WorkoutCard/day-column-cards";
import { WellnessBand } from "../molecules/WorkoutCard/WellnessBand/WellnessBand";
import { shortMonthName, shortWeekdayName } from "./calendar-day-labels";

const formatHeading = (date: string, locale: Locale): string => {
  const d = new Date(date + "T12:00:00Z");
  return `${shortWeekdayName(date, locale)} ${shortMonthName(date, locale)} ${d.getUTCDate()}`;
};

export type CalendarWeekListDayProps = {
  date: string;
  matched: MatchedSessionWithMetadata[];
  plans: CoachingActivity[];
  actuals: WorkoutRecord[];
  isToday: boolean;
  wellness?: DayWellness;
  wellnessResolved: boolean;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onAddClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
};

export function CalendarWeekListDay({
  date,
  matched,
  plans,
  actuals,
  isToday,
  wellness,
  wellnessResolved,
  onWorkoutClick,
  onAddClick,
  onActivityClick,
}: CalendarWeekListDayProps) {
  const t = useTranslate("calendar");
  const locale = useActiveLocale();
  const heading = formatHeading(date, locale);
  return (
    <section
      data-testid={`calendar-list-day-${date}`}
      data-today={isToday ? "true" : undefined}
      aria-current={isToday ? "date" : undefined}
      className="rounded-lg border border-edge p-3"
    >
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
        {heading}
        {isToday && (
          <span className="sr-only">{t("weekList.todaySuffix")}</span>
        )}
      </h2>
      <WellnessBand wellness={wellness} resolved={wellnessResolved} />
      <div className="flex flex-col gap-2">
        {renderDayCards({
          matchedSessions: matched,
          soloPlans: plans,
          soloActuals: actuals,
          view: "list",
          onWorkoutClick,
          onActivityClick,
        })}
      </div>
      <button
        type="button"
        data-testid={`calendar-list-add-${date}`}
        aria-label={t("weekList.addTo", { date: heading })}
        onClick={() => onAddClick(date)}
        className="mt-2 w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-gray-600"
      >
        {t("weekList.add")}
      </button>
    </section>
  );
}
