import { useCallback } from "react";
import { useLocation } from "wouter";

import { calendarWeekHref } from "../../../routing/calendar-week-href";
import { withOrigin } from "../../../routing/with-origin";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { DailyHeader } from "./DailyHeader";
import { PlannedSession } from "./PlannedSession";
import { ReadinessCard } from "./ReadinessCard";
import { TrendsCard } from "./TrendsCard";
import { useTodayData } from "./use-today-data";
import { useTodayFocusNav } from "./use-today-focus-nav";
import { useTodayRouteParams } from "./use-today-route-params";
import { WeekStrip } from "./WeekStrip";

export default function Daily() {
  const { focusDate, focusIso, realTodayIso } = useTodayRouteParams();
  const { profile, days, weekWorkouts, planned, readiness, isFocusToday } =
    useTodayData(focusDate, realTodayIso);
  const nav = useTodayFocusNav(focusIso, realTodayIso);
  const [, navigate] = useLocation();

  const handleWorkoutClick = useCallback(
    (workout: WorkoutRecord) => {
      // Mirror the calendar: ready workouts open their editor (origin "daily",
      // carrying the focused day so Back returns here); raw/skipped open in the
      // calendar week where the processing affordances live.
      if (workout.state === "raw" || workout.state === "skipped") {
        navigate(calendarWeekHref(workout.date));
      } else {
        navigate(
          withOrigin(`/workout/${workout.id}`, "daily", {
            date: isFocusToday ? undefined : focusIso,
          })
        );
      }
    },
    [navigate, isFocusToday, focusIso]
  );

  const handleActivityClick = useCallback(
    (activity: CoachingActivity) => navigate(calendarWeekHref(activity.date)),
    [navigate]
  );

  return (
    <div className="space-y-6 px-4 pb-8" data-testid="daily-page">
      <DailyHeader
        focusDate={focusDate}
        isFocusToday={isFocusToday}
        onBackToToday={nav.backToToday}
      />
      <ReadinessCard readiness={readiness} />
      <WeekStrip
        days={days}
        workouts={weekWorkouts}
        profile={profile}
        onSelectDay={nav.selectDay}
        onPrev={nav.goPrev}
        onNext={nav.goNext}
      />
      <TrendsCard />
      <PlannedSession
        buckets={planned}
        onWorkoutClick={handleWorkoutClick}
        onActivityClick={handleActivityClick}
      />
    </div>
  );
}
