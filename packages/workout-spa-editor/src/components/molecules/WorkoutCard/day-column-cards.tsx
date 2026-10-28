/**
 * Per-bucket renderers for DayColumn — kept separate so the top-level
 * component stays under the per-function line cap.
 *
 * The `view` prop is the calendar-level preference (grid / list) and is
 * translated into the card's own visual density at this boundary so the
 * card components keep their existing `"compact" | "comfortable"`
 * vocabulary (used by MatchedSessionCard and CoachingActivityCard).
 *
 * `workoutCardPointerDownFor` is an optional binding passed by the
 * Grid view to enable drag-to-reschedule on solo workouts and movable
 * matched sessions; the List view never supplies it, so card pointer
 * events stay as plain clicks. A coach plan is never draggable.
 */

import type { PointerEvent } from "react";

import { isProjectedWorkoutRecord } from "../../../application/coaching/activity-to-workout-record";
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CalendarView } from "../../../types/user-preferences";
import { CoachingActivityCard } from "../CoachingCard/CoachingActivityCard";
import { renderMatchedCards } from "./day-column-matched-cards";
import { DRAGGABLE_CARD } from "./draggable-card";
import { WorkoutCard } from "./WorkoutCard";

export type DayCardBuckets = {
  matchedSessions: MatchedSessionWithMetadata[];
  soloPlans: CoachingActivity[];
  soloActuals: WorkoutRecord[];
  view: CalendarView;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
  workoutCardPointerDownFor?: (
    workoutId: string
  ) => (event: PointerEvent) => void;
  executedRefIds?: ReadonlySet<string>;
};

const viewToCardDensity = (view: CalendarView): "compact" | "comfortable" =>
  view === "list" ? "comfortable" : "compact";

export function renderDayCards(buckets: DayCardBuckets) {
  const cardDensity = viewToCardDensity(buckets.view);
  const bindCardDrag = buckets.workoutCardPointerDownFor;
  return (
    <>
      {renderMatchedCards({
        sessions: buckets.matchedSessions,
        view: buckets.view,
        density: cardDensity,
        onActivityClick: buckets.onActivityClick,
        bindCardDrag,
        executedRefIds: buckets.executedRefIds,
      })}
      {buckets.soloPlans.map((a) => (
        <CoachingActivityCard
          key={a.id}
          activity={a}
          onClick={buckets.onActivityClick}
          view={buckets.view}
        />
      ))}
      {buckets.soloActuals.map((w) =>
        // Projected activities have no WorkoutRecord to reschedule (F5
        // gate A1) — never wire drag for them, so there is no failed
        // persistence call to catch/toast in the first place.
        bindCardDrag && !isProjectedWorkoutRecord(w) ? (
          <div
            key={w.id}
            className={DRAGGABLE_CARD}
            onPointerDown={bindCardDrag(w.id)}
          >
            <WorkoutCard
              workout={w}
              view={buckets.view}
              onClick={buckets.onWorkoutClick}
            />
          </div>
        ) : (
          <WorkoutCard
            key={w.id}
            workout={w}
            view={buckets.view}
            onClick={buckets.onWorkoutClick}
          />
        )
      )}
    </>
  );
}
