import type { PointerEvent } from "react";

import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { DayWellness } from "../../../types/health/day-wellness";
import type { CalendarView } from "../../../types/user-preferences";
import { renderDayCards } from "./day-column-cards";
import { DayColumnAddButton } from "./DayColumnAddButton";
import { WellnessBand } from "./WellnessBand/WellnessBand";

export type DayColumnProps = {
  date: string;
  isToday: boolean;
  view?: CalendarView;
  matchedSessions?: MatchedSessionWithMetadata[];
  soloPlans?: CoachingActivity[];
  soloActuals?: WorkoutRecord[];
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onAddClick: (date: string) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
  workoutCardPointerDownFor?: (
    workoutId: string
  ) => (event: PointerEvent) => void;
  dropTargetActive?: boolean;
  wellness?: DayWellness;
  /** Whether the week-level wellness query has resolved (see WellnessBand). */
  wellnessResolved?: boolean;
};

const TODAY_BODY_TINT = "bg-primary-50/40 dark:bg-primary-900/20";
const DROP_RING = "ring-2 ring-primary-500 ring-offset-1";

export function DayColumn({
  date,
  isToday,
  view = "grid",
  matchedSessions = [],
  soloPlans = [],
  soloActuals = [],
  onWorkoutClick,
  onAddClick,
  onActivityClick,
  workoutCardPointerDownFor,
  dropTargetActive = false,
  wellness,
  wellnessResolved = false,
}: DayColumnProps) {
  const tint = isToday ? TODAY_BODY_TINT : "";
  const dropRing = dropTargetActive ? DROP_RING : "";
  return (
    <div
      data-testid={`day-column-${date}`}
      data-day={date}
      data-today={isToday ? "true" : undefined}
      data-drop-target={dropTargetActive ? "true" : undefined}
      aria-current={isToday ? "date" : undefined}
      role="group"
      className={`flex min-h-[120px] min-w-[140px] flex-1 flex-col rounded-lg border p-2 sm:min-w-0 ${tint} ${dropRing}`}
    >
      <WellnessBand wellness={wellness} resolved={wellnessResolved} />
      <div className="flex flex-1 flex-col gap-1.5">
        {renderDayCards({
          matchedSessions,
          soloPlans,
          soloActuals,
          view,
          onWorkoutClick,
          onActivityClick,
          workoutCardPointerDownFor,
        })}
      </div>
      <DayColumnAddButton date={date} onAddClick={onAddClick} />
    </div>
  );
}
