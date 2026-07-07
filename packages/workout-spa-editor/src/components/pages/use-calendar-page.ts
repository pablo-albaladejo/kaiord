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

import type { MatchSuggestion } from "../../application/match-suggestion";
import { useCalendarWellnessWeekLive } from "../../hooks/health/use-calendar-wellness-week-live";
import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import {
  type AutoMatchBannerActions,
  useAutoMatchBannerActions,
} from "../../hooks/use-auto-match-banner-actions";
import { useAutoMatchSuggestions } from "../../hooks/use-auto-match-suggestions";
import { useCalendarExecuted } from "../../hooks/use-calendar-executed";
import { useCoachingActivities } from "../../hooks/use-coaching-activities";
import { useCoachingAutoSync } from "../../hooks/use-coaching-auto-sync";
import { useMatchedSessions } from "../../hooks/use-matched-sessions";
import { useSetCalendarView } from "../../hooks/use-set-calendar-view";
import { useUserPreferences } from "../../hooks/use-user-preferences";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { DayWellness } from "../../types/health/day-wellness";
import type { CalendarView } from "../../types/user-preferences";
import type { CalendarBuckets } from "./calendar-buckets";
import { useCalendarBucketsMemo } from "./use-calendar-buckets-memo";
import { useCalendarState } from "./use-calendar-state";
import { useSelectedActivity } from "./use-selected-activity";

const defaultView = (): CalendarView =>
  typeof window !== "undefined" && window.innerWidth >= 768 ? "grid" : "list";

export type CalendarPageReadyState = {
  state: "ready";
  s: ReturnType<typeof useCalendarState>;
  coaching: ReturnType<typeof useCoachingActivities>;
  buckets: CalendarBuckets;
  view: CalendarView | undefined;
  onViewChange: (v: CalendarView) => void;
  selectedActivity: CoachingActivity | null;
  setSelectedActivity: (a: CoachingActivity | null) => void;
  suggestions: MatchSuggestion[];
  bannerActions: AutoMatchBannerActions;
  wellnessByDay: Record<string, DayWellness> | undefined;
};

export type CalendarPageState =
  { state: "redirect" } | { state: "skeleton" } | CalendarPageReadyState;

export function useCalendarPage(): CalendarPageState {
  const s = useCalendarState();
  const coaching = useCoachingActivities(s.data.days);
  useCoachingAutoSync(coaching.syncSources, s.data.days[0]);
  const selected = useSelectedActivity(coaching.byDay);
  const profileId = useActiveProfileLive()?.id ?? null;
  const weekStart = s.data.days[0] ?? "";
  const wellnessByDay = useCalendarWellnessWeekLive(
    profileId,
    weekStart,
    s.data.days.at(-1) ?? ""
  );
  const rawMatched = useMatchedSessions(profileId, s.data.days);
  const activitiesByDay = useCalendarExecuted(profileId, rawMatched, s.data);
  const suggestions = useAutoMatchSuggestions(profileId, weekStart);
  const bannerActions = useAutoMatchBannerActions(profileId, weekStart);
  const prefs = useUserPreferences({ profileId, defaultView: defaultView() });
  const buckets = useCalendarBucketsMemo({
    days: s.data.days,
    workoutsByDay: s.data.workoutsByDay,
    coachingByDay: coaching.byDay,
    activitiesByDay,
    matched: rawMatched ?? [],
  });
  const onViewChange = useSetCalendarView(profileId);

  if (!s.data.isValidWeek) return { state: "redirect" };
  if (s.data.hydration === "pending") return { state: "skeleton" };
  return {
    state: "ready",
    s,
    coaching,
    buckets,
    view: prefs?.calendarView,
    onViewChange,
    ...selected,
    suggestions: suggestions ?? [],
    bannerActions,
    wellnessByDay,
  };
}
