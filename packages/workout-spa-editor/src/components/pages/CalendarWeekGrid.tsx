/**
 * 7-column grid of day columns. The page builds three per-day buckets
 * (matched / solo plan / solo actual) and the grid passes them through
 * unchanged so DayColumn can render them in the spec-mandated order.
 *
 * Mobile uses snap-x snap-proximity (NOT mandatory, which traps focus
 * for VoiceOver / TalkBack users).
 */

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { CalendarDensity } from "../../types/user-preferences";
import { DayColumn } from "../molecules/WorkoutCard/DayColumn";

export type CalendarWeekGridProps = {
  days: string[];
  matchedByDay?: Record<string, MatchedSessionWithMetadata[]>;
  soloPlansByDay?: Record<string, CoachingActivity[]>;
  soloActualsByDay?: Record<string, WorkoutRecord[]>;
  /** Back-compat fallback for callers not yet split into solo/matched buckets. */
  workoutsByDay?: Record<string, WorkoutRecord[]>;
  coachingByDay?: Record<string, CoachingActivity[]>;
  todayDate: string;
  density?: CalendarDensity;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onEmptyDayClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
};

export function CalendarWeekGrid({
  days,
  matchedByDay = {},
  soloPlansByDay,
  soloActualsByDay,
  workoutsByDay,
  coachingByDay,
  todayDate,
  density,
  onWorkoutClick,
  onEmptyDayClick,
  onActivityClick,
}: CalendarWeekGridProps) {
  // Back-compat: if the caller passes the legacy buckets, treat them as
  // solo. Once all callers migrate to matchedByDay / soloPlansByDay /
  // soloActualsByDay, the legacy props can be removed.
  const plans = soloPlansByDay ?? coachingByDay ?? {};
  const actuals = soloActualsByDay ?? workoutsByDay ?? {};

  return (
    <div
      data-testid="calendar-week-grid"
      className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-2 motion-reduce:snap-none sm:grid sm:snap-none sm:grid-cols-7 sm:overflow-x-visible sm:pb-0"
    >
      {days.map((date) => (
        <DayColumn
          key={date}
          date={date}
          isToday={date === todayDate}
          density={density}
          matchedSessions={matchedByDay[date] ?? []}
          soloPlans={plans[date] ?? []}
          soloActuals={actuals[date] ?? []}
          onWorkoutClick={onWorkoutClick}
          onEmptyDayClick={onEmptyDayClick}
          onActivityClick={onActivityClick}
        />
      ))}
    </div>
  );
}
