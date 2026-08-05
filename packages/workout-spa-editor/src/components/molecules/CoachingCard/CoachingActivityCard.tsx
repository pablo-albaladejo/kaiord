/**
 * Read-only card for coach-planned activities (T2G / TP / future).
 *
 * Click opens a CoachingActivityDialog (managed by the calendar page).
 * Visual contract is shared with WorkoutCard and MatchedSessionCard via
 * `CardShell`. The lateral border is deliberately neutral: a coaching activity
 * carries a normalised `effort` and no steps, and an effort rating is not a
 * training zone — drawing one from it would invent a fact. The zone appears
 * once the plan is expanded into a structured workout.
 *
 * The sport icon is the sport identifier (no duplicate text label), the status
 * is a word in a chip, and the origin (T2G, TP) is a muted text chip rather
 * than a coloured badge.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { CardShell } from "../CardShell/CardShell";
import { LifecycleChip } from "../CardShell/LifecycleChip";
import { zoneBorderClass } from "../CardShell/status-tokens";
import { deriveCoachingActivityLifecycle } from "../WorkoutCard/session-lifecycle";
import { SessionLifecycleBadges } from "../WorkoutCard/SessionLifecycleBadges";

const MAX_EFFORT = 5;

export type CoachingActivityCardProps = {
  activity: CoachingActivity;
  onClick?: (activity: CoachingActivity) => void;
};

export function CoachingActivityCard({
  activity,
  onClick,
}: CoachingActivityCardProps) {
  const t = useTranslate("coaching");
  const intensity = Math.min(activity.effort ?? 0, MAX_EFFORT);
  const statusLabel = t(`status.${activity.status}`);
  const lifecycle = deriveCoachingActivityLifecycle(activity);

  return (
    <CardShell
      borderClass={zoneBorderClass(null)}
      ariaLabel={`${activity.title}, ${activity.sport.label}, ${statusLabel}`}
      onClick={() => onClick?.(activity)}
      testId={`coaching-card-${activity.id}`}
      originChip={activity.sourceBadge}
      titleRow={
        <>
          <span role="img" aria-label={activity.sport.label}>
            {activity.sport.icon}
          </span>
          <span className="min-w-0 flex-1 line-clamp-2 wrap-anywhere">
            {activity.title}
          </span>
          <LifecycleChip label={statusLabel} />
        </>
      }
      metadataRow={
        <>
          {activity.duration && <span>{activity.duration}</span>}
          {intensity > 0 && (
            <span aria-label={t("effortOf", { n: intensity, max: MAX_EFFORT })}>
              {"●".repeat(intensity)}
              {"○".repeat(MAX_EFFORT - intensity)}
            </span>
          )}
          <SessionLifecycleBadges flags={lifecycle} />
        </>
      }
    />
  );
}
