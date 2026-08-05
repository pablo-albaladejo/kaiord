/**
 * The discriminated state `useCalendarPage` hands to `CalendarPageView`.
 *
 * Split out of the hook so the hook file stays inside the line cap; the shape
 * is the contract between the two and belongs to neither more than the other.
 */
import type { MatchSuggestion } from "../../application/match-suggestion";
import type { AutoMatchBannerActions } from "../../hooks/use-auto-match-banner-actions";
import type { useCoachingActivities } from "../../hooks/use-coaching-activities";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { DayWellness } from "../../types/health/day-wellness";
import type { Profile } from "../../types/profile";
import type { CalendarView } from "../../types/user-preferences";
import type { CalendarBuckets } from "./calendar-buckets";
import type { useCalendarState } from "./use-calendar-state";

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
  /** Published to the cards so every one of them resolves zones from the same
      thresholds without opening its own live query. */
  profile: Profile | null;
};

export type CalendarPageState =
  { state: "redirect" } | { state: "skeleton" } | CalendarPageReadyState;
