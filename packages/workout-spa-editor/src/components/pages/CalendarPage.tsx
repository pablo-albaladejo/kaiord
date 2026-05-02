/**
 * Calendar week view, the editor's home page.
 *
 * Builds three per-day buckets (matched / solo plan / solo actual) by
 * joining the coaching activities, workouts, and matches live queries
 * once at the page level — DayColumn / CalendarWeekGrid then render
 * the buckets in the order spec'd by spa-calendar.
 *
 * Coaching data flows through the generic CoachingSource registry —
 * this file has zero platform-specific imports.
 */

import { useMemo, useState } from "react";
import { Redirect } from "wouter";

import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { useCoachingAutoSync } from "../../hooks/use-coaching-auto-sync";
import type { MatchedSessionWithMetadata as PageMatchedSession } from "../../hooks/use-matched-sessions";
import { useMatchedSessions } from "../../hooks/use-matched-sessions";
import { useSetCalendarDensity } from "../../hooks/use-set-calendar-density";
import { useUserPreferences } from "../../hooks/use-user-preferences";
import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivity } from "../../types/coaching-activity";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { CalendarDialogs } from "./CalendarDialogs";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarWeekGrid } from "./CalendarWeekGrid";
import { useCalendarState } from "./use-calendar-state";

const viewportDefaultDensity = (): "compact" | "comfortable" =>
  typeof window !== "undefined" && window.innerWidth >= 768
    ? "compact"
    : "comfortable";

export default function CalendarPage() {
  const s = useCalendarState();
  const coaching = useCoachingActivities(s.data.days);
  useCoachingAutoSync(coaching.syncSources, s.data.days[0]);
  const [selectedActivity, setSelectedActivity] =
    useState<CoachingActivity | null>(null);
  const profileId = useActiveProfileLive()?.id ?? null;
  const rawMatched = useMatchedSessions(profileId, s.data.days);
  const prefs = useUserPreferences({
    profileId,
    defaultDensity: viewportDefaultDensity(),
  });
  const buckets = useMemo(
    () =>
      buildBuckets({
        days: s.data.days,
        workoutsByDay: s.data.workoutsByDay,
        coachingByDay: coaching.byDay,
        matched: rawMatched ?? [],
      }),
    [s.data.days, s.data.workoutsByDay, coaching.byDay, rawMatched]
  );
  const handleDensityChange = useSetCalendarDensity(profileId);

  if (!s.data.isValidWeek) return <Redirect to="/calendar" />;
  if (s.data.hydration === "pending") return <CalendarSkeleton />;

  return (
    <CalendarPageView
      s={s}
      coaching={coaching}
      buckets={buckets}
      density={prefs?.calendarDensity}
      onDensityChange={handleDensityChange}
      selectedActivity={selectedActivity}
      setSelectedActivity={setSelectedActivity}
    />
  );
}

type CalendarPageViewProps = {
  s: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
  buckets: Buckets;
  density: "compact" | "comfortable" | undefined;
  onDensityChange: (d: "compact" | "comfortable") => void;
  selectedActivity: CoachingActivity | null;
  setSelectedActivity: (a: CoachingActivity | null) => void;
};

function CalendarPageView({
  s,
  coaching,
  buckets,
  density,
  onDensityChange,
  selectedActivity,
  setSelectedActivity,
}: CalendarPageViewProps) {
  return (
    <div className="space-y-4" data-testid="calendar-page">
      <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
        Calendar
      </h1>
      <CalendarHeader
        state={s}
        coaching={coaching}
        density={density}
        onDensityChange={onDensityChange}
      />
      <CalendarWeekGrid
        days={s.data.days}
        matchedByDay={buckets.matchedByDay}
        soloPlansByDay={buckets.soloPlansByDay}
        soloActualsByDay={buckets.soloActualsByDay}
        todayDate={new Date().toISOString().slice(0, 10)}
        density={density}
        onWorkoutClick={s.handleWorkoutClick}
        onEmptyDayClick={s.setEmptyDayDate}
        onActivityClick={setSelectedActivity}
      />
      <CalendarDialogs
        selectedWorkout={s.selectedWorkout}
        emptyDayDate={s.emptyDayDate}
        selectedCoachingActivity={selectedActivity}
        onCloseWorkout={() => s.setSelectedWorkout(null)}
        onCloseDay={() => s.setEmptyDayDate(null)}
        onCloseCoaching={() => setSelectedActivity(null)}
        expandActivity={coaching.expandActivity}
      />
    </div>
  );
}

type BuildBucketsArgs = {
  days: string[];
  workoutsByDay: Record<string, WorkoutRecord[]>;
  coachingByDay: Record<string, CoachingActivity[]>;
  matched: PageMatchedSession[];
};

type Buckets = {
  matchedByDay: Record<string, PageMatchedSession[]>;
  soloPlansByDay: Record<string, CoachingActivity[]>;
  soloActualsByDay: Record<string, WorkoutRecord[]>;
};

function buildBuckets({
  days,
  workoutsByDay,
  coachingByDay,
  matched,
}: BuildBucketsArgs): Buckets {
  const matchedActivityIds = new Set(matched.map((m) => m.activity.id));
  const matchedWorkoutIds = new Set(matched.map((m) => m.workout.id));
  const matchedByDay: Record<string, PageMatchedSession[]> = {};
  const soloPlansByDay: Record<string, CoachingActivity[]> = {};
  const soloActualsByDay: Record<string, WorkoutRecord[]> = {};
  for (const day of days) {
    matchedByDay[day] = matched.filter((m) => m.match.date === day);
    soloPlansByDay[day] = (coachingByDay[day] ?? []).filter(
      (a) => !matchedActivityIds.has(a.id)
    );
    soloActualsByDay[day] = (workoutsByDay[day] ?? []).filter(
      (w) => !matchedWorkoutIds.has(w.id)
    );
  }
  return { matchedByDay, soloPlansByDay, soloActualsByDay };
}
