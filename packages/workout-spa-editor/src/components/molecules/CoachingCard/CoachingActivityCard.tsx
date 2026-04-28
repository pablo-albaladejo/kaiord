/**
 * CoachingActivityCard — Read-only card for coach-planned activities.
 *
 * Click opens a CoachingActivityDialog (managed by the calendar page).
 * Earlier in-place description toggle was replaced with a dialog (per
 * spa-coaching-integration "CoachingActivityDialog" requirement).
 */

import type { CoachingActivity } from "../../../types/coaching-activity";

export type CoachingActivityCardProps = {
  activity: CoachingActivity;
  onClick?: (activity: CoachingActivity) => void;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-orange-500",
  completed: "text-green-600",
  skipped: "text-gray-400",
};

export function CoachingActivityCard({
  activity,
  onClick,
}: CoachingActivityCardProps) {
  const intensity = Math.min(activity.effort ?? 0, 5);

  return (
    <button
      type="button"
      data-testid={`coaching-card-${activity.id}`}
      className="w-full rounded-md border border-dashed border-rose-300 bg-rose-50 p-2 text-left text-sm transition-shadow hover:shadow-md dark:border-rose-800 dark:bg-rose-950"
      onClick={() => onClick?.(activity)}
    >
      <div className="flex items-center gap-1.5">
        <span title={activity.sport.label}>{activity.sport.icon}</span>
        <span className="truncate font-medium">{activity.title}</span>
        <span className="ml-auto rounded bg-rose-200 px-1 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900 dark:text-rose-300">
          {activity.sourceBadge}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{activity.sport.label}</span>
        {activity.duration && <span>{activity.duration}</span>}
        {intensity > 0 && (
          <span title={`Intensity: ${intensity}/5`}>
            {"●".repeat(intensity)}
            {"○".repeat(5 - intensity)}
          </span>
        )}
        <span
          className={`ml-auto text-xs ${STATUS_COLORS[activity.status] ?? ""}`}
        >
          {activity.status}
        </span>
      </div>
    </button>
  );
}
