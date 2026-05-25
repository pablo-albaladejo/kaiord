/** Vertical list view for the calendar week — one section per day. */

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { DayWellness } from "../../types/health/day-wellness";
import { renderDayCards } from "../molecules/WorkoutCard/day-column-cards";
import { WellnessBand } from "../molecules/WorkoutCard/WellnessBand/WellnessBand";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// prettier-ignore
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const formatHeading = (date: string): string => {
  const d = new Date(date + "T12:00:00Z");
  return `${DAY_NAMES[(d.getUTCDay() + 6) % 7] ?? ""} ${MONTH_NAMES[d.getUTCMonth()] ?? ""} ${d.getUTCDate()}`;
};

export type CalendarWeekListProps = {
  days: string[];
  matchedByDay?: Record<string, MatchedSessionWithMetadata[]>;
  soloPlansByDay?: Record<string, CoachingActivity[]>;
  soloActualsByDay?: Record<string, WorkoutRecord[]>;
  todayDate: string;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onAddClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
  wellnessByDay?: Record<string, DayWellness>;
};

export function CalendarWeekList({
  days,
  matchedByDay = {},
  soloPlansByDay = {},
  soloActualsByDay = {},
  todayDate,
  onWorkoutClick,
  onAddClick,
  onActivityClick,
  wellnessByDay,
}: CalendarWeekListProps) {
  return (
    <div data-testid="calendar-week-list" className="flex flex-col gap-3">
      {days.map((date) => {
        const matched = matchedByDay[date] ?? [];
        const plans = soloPlansByDay[date] ?? [];
        const actuals = soloActualsByDay[date] ?? [];
        const isToday = date === todayDate;
        return (
          <section
            key={date}
            data-testid={`calendar-list-day-${date}`}
            data-today={isToday ? "true" : undefined}
            aria-current={isToday ? "date" : undefined}
            className="rounded-lg border p-3"
          >
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              {formatHeading(date)}
              {isToday && <span className="sr-only"> (today)</span>}
            </h2>
            <WellnessBand wellness={wellnessByDay?.[date]} />
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
              aria-label={`Add to ${formatHeading(date)}`}
              onClick={() => onAddClick(date)}
              className="mt-2 w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-gray-600"
            >
              + Add
            </button>
          </section>
        );
      })}
    </div>
  );
}
