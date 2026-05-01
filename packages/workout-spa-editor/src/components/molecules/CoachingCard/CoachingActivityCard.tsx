/**
 * Read-only card for coach-planned activities (T2G / TP / future).
 *
 * Click opens a CoachingActivityDialog (managed by the calendar page).
 * Visual contract is shared with WorkoutCard and MatchedSessionCard via
 * `CardShell` — status drives the lateral border colour, the sport icon
 * is the sport identifier (no duplicate text label), and the origin
 * (T2G, TP) is a muted text chip rather than a coloured badge.
 */

import type { CoachingActivity } from "../../../types/coaching-activity";
import { CardShell } from "../CardShell/CardShell";
import { statusToColourClass, statusToIcon } from "../CardShell/status-tokens";

export type CoachingActivityCardProps = {
  activity: CoachingActivity;
  density?: "compact" | "comfortable";
  onClick?: (activity: CoachingActivity) => void;
};

export function CoachingActivityCard({
  activity,
  density = "compact",
  onClick,
}: CoachingActivityCardProps) {
  const intensity = Math.min(activity.effort ?? 0, 5);
  const status = statusToIcon(activity.status);
  const StatusIcon = status.Component;

  return (
    <CardShell
      borderClass={statusToColourClass(activity.status)}
      ariaLabel={`${activity.title}, ${activity.sport.label}, ${status.label}`}
      onClick={() => onClick?.(activity)}
      testId={`coaching-card-${activity.id}`}
      originChip={activity.sourceBadge}
      titleRow={
        <>
          <span role="img" aria-label={activity.sport.label}>
            {activity.sport.icon}
          </span>
          <span className="min-w-0 flex-1">{activity.title}</span>
          <StatusIcon
            role="img"
            aria-label={status.label}
            className="h-4 w-4 shrink-0"
          />
        </>
      }
      metadataRow={
        <>
          {activity.duration && <span>{activity.duration}</span>}
          {intensity > 0 && (
            <span aria-label={`Intensity ${intensity} of 5`}>
              {"●".repeat(intensity)}
              {"○".repeat(5 - intensity)}
            </span>
          )}
          {density === "comfortable" && (
            <span className="ml-auto text-[10px] uppercase tracking-wide">
              {status.label}
            </span>
          )}
        </>
      }
    />
  );
}
