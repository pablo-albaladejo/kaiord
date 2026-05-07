/**
 * useCalendarPage — orchestrates the data plumbing for `CalendarPage`.
 *
 * Joins the calendar state (week + handlers), coaching activity registry,
 * matched / suggested sessions, and per-profile UI preferences into a
 * single discriminated `state` so the view component is a pure render.
 *
 * The early-return states (`"redirect"` / `"skeleton"`) are surfaced as
 * variants of the same union — the page does not branch on hooks, only
 * on the resulting `state`. When `profileId` is null, suggestions and
 * banner actions still resolve (the underlying hooks gate on the same
 * id), so the view falls back to a profile-less calendar without crashing.
 */

import { useMemo } from "react";

import type { MatchSuggestion } from "../../application/match-suggestion";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import {
  type AutoMatchBannerActions,
  useAutoMatchBannerActions,
} from "../../hooks/use-auto-match-banner-actions";
import { useAutoMatchSuggestions } from "../../hooks/use-auto-match-suggestions";
import { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { useCoachingAutoSync } from "../../hooks/use-coaching-auto-sync";
import { useMatchedSessions } from "../../hooks/use-matched-sessions";
import { useSetCalendarDensity } from "../../hooks/use-set-calendar-density";
import { useUserPreferences } from "../../hooks/use-user-preferences";
import type { CoachingActivity } from "../../types/coaching-activity";
import { buildCalendarBuckets, type CalendarBuckets } from "./calendar-buckets";
import { useCalendarState } from "./use-calendar-state";
import { useSelectedActivity } from "./use-selected-activity";

const viewportDefaultDensity = (): "compact" | "comfortable" =>
  typeof window !== "undefined" && window.innerWidth >= 768
    ? "compact"
    : "comfortable";

export type CalendarPageReadyState = {
  state: "ready";
  s: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
  buckets: CalendarBuckets;
  density: "compact" | "comfortable" | undefined;
  onDensityChange: (d: "compact" | "comfortable") => void;
  selectedActivity: CoachingActivity | null;
  setSelectedActivity: (a: CoachingActivity | null) => void;
  suggestions: MatchSuggestion[];
  bannerActions: AutoMatchBannerActions;
};

export type CalendarPageState =
  | { state: "redirect" }
  | { state: "skeleton" }
  | CalendarPageReadyState;

export function useCalendarPage(): CalendarPageState {
  const s = useCalendarState();
  const coaching = useCoachingActivities(s.data.days);
  useCoachingAutoSync(coaching.syncSources, s.data.days[0]);
  const { selectedActivity, setSelectedActivity } = useSelectedActivity(
    coaching.byDay
  );
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
  const onDensityChange = useSetCalendarDensity(profileId);

  if (!s.data.isValidWeek) return { state: "redirect" };
  if (s.data.hydration === "pending") return { state: "skeleton" };
  return {
    state: "ready",
    s,
    coaching,
    buckets,
    density: prefs?.calendarDensity,
    onDensityChange,
    selectedActivity,
    setSelectedActivity,
    suggestions: suggestions ?? [],
    bannerActions,
  };
}
