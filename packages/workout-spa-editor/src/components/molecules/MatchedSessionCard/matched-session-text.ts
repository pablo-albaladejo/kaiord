/**
 * Pure text helpers for MatchedSessionCard — kept separate so the
 * component file stays under the line-cap.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { formatDuration } from "../WorkoutCard/workout-card-utils";

export type MatchedSession = {
  activity: CoachingActivity;
  workout: WorkoutRecord;
  complianceScore: number | null;
};

export const formatPercent = (score: number | null): string =>
  score === null ? "compliance unavailable" : `${Math.round(score * 100)}%`;

export const planTitle = (s: MatchedSession): string => s.activity.title;

export const actualTitle = (s: MatchedSession): string =>
  s.workout.raw?.title ?? s.workout.sport;

export const planDurationText = (s: MatchedSession): string =>
  s.activity.duration ?? "—";

export const actualDurationText = (s: MatchedSession): string =>
  s.workout.raw?.duration ? formatDuration(s.workout.raw.duration.value) : "—";

export const buildAriaLabel = (s: MatchedSession): string => {
  const pct = formatPercent(s.complianceScore);
  return `Matched session — actual: ${actualTitle(s)}; planned: ${planTitle(s)}; ${pct}`;
};

export const buildTooltip = (s: MatchedSession): string => {
  const dur = `${actualDurationText(s)} / ${planDurationText(s)}`;
  return s.complianceScore === null
    ? `compliance unavailable (${dur})`
    : `${formatPercent(s.complianceScore)} (${dur})`;
};
