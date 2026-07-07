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
 * Grid view to enable drag-to-reschedule; the List view never supplies
 * it, so card pointer events stay as plain clicks.
 */

import type { PointerEvent } from "react";

import { isProjectedWorkoutRecord } from "../../../application/coaching/activity-to-workout-record";
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CalendarView } from "../../../types/user-preferences";
import { CoachingActivityCard } from "../CoachingCard/CoachingActivityCard";
import { MatchedSessionCard } from "../MatchedSessionCard/MatchedSessionCard";
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
};

const viewToCardDensity = (view: CalendarView): "compact" | "comfortable" =>
  view === "list" ? "comfortable" : "compact";

export function renderDayCards(buckets: DayCardBuckets) {
  const cardDensity = viewToCardDensity(buckets.view);
  const bindCardDrag = buckets.workoutCardPointerDownFor;
  return (
    <>
      {buckets.matchedSessions.map((s) => (
        <MatchedSessionCard
          key={s.match.id}
          session={s}
          density={cardDensity}
          onClick={buckets.onActivityClick}
        />
      ))}
      {buckets.soloPlans.map((a) => (
        <CoachingActivityCard
          key={a.id}
          activity={a}
          density={cardDensity}
          onClick={buckets.onActivityClick}
        />
      ))}
      {buckets.soloActuals.map((w) =>
        // Projected activities have no WorkoutRecord to reschedule (F5
        // gate A1) — never wire drag for them, so there is no failed
        // persistence call to catch/toast in the first place.
        bindCardDrag && !isProjectedWorkoutRecord(w) ? (
          <div key={w.id} onPointerDown={bindCardDrag(w.id)}>
            <WorkoutCard workout={w} onClick={buckets.onWorkoutClick} />
          </div>
        ) : (
          <WorkoutCard
            key={w.id}
            workout={w}
            onClick={buckets.onWorkoutClick}
          />
        )
      )}
    </>
  );
}
