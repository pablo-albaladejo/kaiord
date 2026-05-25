/**
 * 7-column grid of day columns. The page builds three per-day buckets
 * (matched / solo plan / solo actual) and the grid passes them through
 * unchanged so DayColumn can render them in the spec-mandated order.
 *
 * A sticky day-name header row above the columns owns the day-name +
 * today pill + multi-workout badge. Each day's column body picks up the
 * today tint via DayColumn so the sticky cell and the body match.
 *
 * Drag-to-reschedule is wired here (and only here) — the List view does
 * not register pointer drags. The hook is viewport-gated to `>= 768 px`
 * inside `usePointerDrag`.
 *
 * Mobile uses snap-x snap-proximity (NOT mandatory, which traps focus
 * for VoiceOver / TalkBack users).
 */

import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { DayWellness } from "../../types/health/day-wellness";
import type { CalendarView } from "../../types/user-preferences";
import { DayColumn } from "../molecules/WorkoutCard/DayColumn";
import { useGridReschedule } from "./calendar-dnd/use-grid-reschedule";
import { CalendarWeekGridHeader } from "./CalendarWeekGridHeader";

export type CalendarWeekGridProps = {
  days: string[];
  matchedByDay?: Record<string, MatchedSessionWithMetadata[]>;
  soloPlansByDay?: Record<string, CoachingActivity[]>;
  soloActualsByDay?: Record<string, WorkoutRecord[]>;
  /** Back-compat fallback for callers not yet split into solo/matched buckets. */
  workoutsByDay?: Record<string, WorkoutRecord[]>;
  coachingByDay?: Record<string, CoachingActivity[]>;
  todayDate: string;
  view?: CalendarView;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onAddClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
  wellnessByDay?: Record<string, DayWellness>;
};

export function CalendarWeekGrid({
  days,
  matchedByDay = {},
  soloPlansByDay,
  soloActualsByDay,
  workoutsByDay,
  coachingByDay,
  todayDate,
  view,
  onWorkoutClick,
  onAddClick,
  onActivityClick,
  wellnessByDay,
}: CalendarWeekGridProps) {
  // Back-compat: if the caller passes the legacy buckets, treat them as
  // solo. Once all callers migrate to matchedByDay / soloPlansByDay /
  // soloActualsByDay, the legacy props can be removed.
  const plans = soloPlansByDay ?? coachingByDay ?? {};
  const actuals = soloActualsByDay ?? workoutsByDay ?? {};

  const countFor = (date: string): number =>
    (matchedByDay[date]?.length ?? 0) +
    (plans[date]?.length ?? 0) +
    (actuals[date]?.length ?? 0);

  const { bind, dropTargetId } = useGridReschedule();

  return (
    <div data-testid="calendar-week-grid">
      <CalendarWeekGridHeader
        days={days}
        todayDate={todayDate}
        countFor={countFor}
      />
      <div className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-2 motion-reduce:snap-none sm:grid sm:snap-none sm:grid-cols-7 sm:overflow-x-visible sm:pb-0">
        {days.map((date) => (
          <DayColumn
            key={date}
            date={date}
            isToday={date === todayDate}
            view={view}
            matchedSessions={matchedByDay[date] ?? []}
            soloPlans={plans[date] ?? []}
            soloActuals={actuals[date] ?? []}
            onWorkoutClick={onWorkoutClick}
            onAddClick={onAddClick}
            onActivityClick={onActivityClick}
            workoutCardPointerDownFor={bind}
            dropTargetActive={dropTargetId === date}
            wellness={wellnessByDay?.[date]}
          />
        ))}
      </div>
    </div>
  );
}
