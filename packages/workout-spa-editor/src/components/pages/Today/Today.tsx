import { useCallback, useMemo } from "react";
import { useLocation } from "wouter";

import { calendarWeekHref } from "../../../routing/calendar-week-href";
import { withOrigin } from "../../../routing/with-origin";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { PlannedSession } from "./PlannedSession";
import { ReadinessCard } from "./ReadinessCard";
import { TodayHeader } from "./TodayHeader";
import { TrendsCard } from "./TrendsCard";
import { useTodayData } from "./use-today-data";
import { WeekStrip } from "./WeekStrip";

export default function Today() {
  const now = useMemo(() => new Date(), []);
  const { profile, days, weekWorkouts, planned, readiness } = useTodayData(now);
  const [, navigate] = useLocation();

  const handleWorkoutClick = useCallback(
    (workout: WorkoutRecord) => {
      // Mirror the calendar: ready workouts open their detail (origin "today"
      // so Back returns here); raw/skipped open in the calendar week, where
      // the processing affordances live.
      if (workout.state === "raw" || workout.state === "skipped") {
        navigate(calendarWeekHref(workout.date));
      } else {
        navigate(withOrigin(`/workout/${workout.id}`, "today"));
      }
    },
    [navigate]
  );

  const handleActivityClick = useCallback(
    (activity: CoachingActivity) => navigate(calendarWeekHref(activity.date)),
    [navigate]
  );

  return (
    <div className="space-y-6 px-4 pb-8" data-testid="today-page">
      <TodayHeader now={now} />
      <ReadinessCard readiness={readiness} />
      <WeekStrip days={days} workouts={weekWorkouts} profile={profile} />
      <TrendsCard />
      <PlannedSession
        buckets={planned}
        onWorkoutClick={handleWorkoutClick}
        onActivityClick={handleActivityClick}
      />
    </div>
  );
}
