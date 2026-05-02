/**
 * Calendar week view, the editor's home page.
 *
 * Builds three per-day buckets (matched / solo plan / solo actual) by
 * joining the coaching activities, workouts, and matches live queries
 * once at the page level — DayColumn / CalendarWeekGrid then render
 * the buckets in the order spec'd by spa-calendar.
 *
 * Auto-match suggestions surface above the grid via `AutoMatchBanner`
 * when `useAutoMatchSuggestions` returns at least one undismissed pair
 * for the visible week. Accept persists a `SessionMatch` (source
 * `auto-suggestion`); Reject persists a per-pair dismissal.
 *
 * Coaching data flows through the generic CoachingSource registry —
 * this file has zero platform-specific imports.
 */

import { useMemo, useState } from "react";
import { Redirect } from "wouter";

import type { MatchSuggestion } from "../../application/match-suggestion";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useAutoMatchBannerActions } from "../../hooks/use-auto-match-banner-actions";
import { useAutoMatchSuggestions } from "../../hooks/use-auto-match-suggestions";
import { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { useCoachingAutoSync } from "../../hooks/use-coaching-auto-sync";
import { useMatchedSessions } from "../../hooks/use-matched-sessions";
import { useSetCalendarDensity } from "../../hooks/use-set-calendar-density";
import { useUserPreferences } from "../../hooks/use-user-preferences";
import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import type { CoachingActivity } from "../../types/coaching-activity";
import { CalendarSkeleton } from "../molecules/WorkoutCard/CalendarSkeleton";
import { AutoMatchBanner } from "../organisms/AutoMatchBanner/AutoMatchBanner";
import { buildCalendarBuckets, type CalendarBuckets } from "./calendar-buckets";
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
  const weekStart = s.data.days[0] ?? "";
  const rawMatched = useMatchedSessions(profileId, s.data.days);
  const suggestions = useAutoMatchSuggestions(profileId, weekStart);
  const bannerActions = useAutoMatchBannerActions(profileId, weekStart);
  const prefs = useUserPreferences({
    profileId,
    defaultDensity: viewportDefaultDensity(),
  });
  const buckets = useMemo(
    () =>
      buildCalendarBuckets({
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
      suggestions={suggestions ?? []}
      bannerActions={bannerActions}
    />
  );
}

type CalendarPageViewProps = {
  s: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
  buckets: CalendarBuckets;
  density: "compact" | "comfortable" | undefined;
  onDensityChange: (d: "compact" | "comfortable") => void;
  selectedActivity: CoachingActivity | null;
  setSelectedActivity: (a: CoachingActivity | null) => void;
  suggestions: MatchSuggestion[];
  bannerActions: {
    onAccept: (s: MatchSuggestion) => Promise<void>;
    onReject: (s: MatchSuggestion) => Promise<void>;
  };
};

function CalendarPageView({
  s,
  coaching,
  buckets,
  density,
  onDensityChange,
  selectedActivity,
  setSelectedActivity,
  suggestions,
  bannerActions,
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
      {suggestions.length > 0 && (
        <AutoMatchBanner
          suggestions={suggestions}
          onAccept={bannerActions.onAccept}
          onReject={bannerActions.onReject}
        />
      )}
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
