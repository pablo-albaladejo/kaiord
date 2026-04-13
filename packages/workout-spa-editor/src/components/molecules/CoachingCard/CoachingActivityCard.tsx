/**
 * CoachingActivityCard — Read-only card for coach-planned activities.
 *
 * Platform-agnostic: renders any CoachingActivity regardless of source.
 * Visually distinct from WorkoutCard: dashed border, source badge.
 */

import { useState } from "react";

import type { CoachingActivity } from "../../../types/coaching-activity";

export type CoachingActivityCardProps = {
  activity: CoachingActivity;
  onExpand?: (activity: CoachingActivity) => void;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-orange-500",
  completed: "text-green-600",
  skipped: "text-gray-400",
};

export function CoachingActivityCard({
  activity,
  onExpand,
}: CoachingActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const effort = Math.min(activity.effort ?? 0, 5);

  const handleClick = () => {
    if (!expanded && onExpand) onExpand(activity);
    setExpanded(!expanded);
  };

  return (
    <button
      type="button"
      data-testid={`coaching-card-${activity.id}`}
      className="w-full rounded-md border border-dashed border-rose-300 bg-rose-50 p-2 text-left text-sm transition-shadow hover:shadow-md dark:border-rose-800 dark:bg-rose-950"
      onClick={handleClick}
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
        {effort > 0 && (
          <span title={`Effort: ${effort}/5`}>
            {"\u25CF".repeat(effort)}
            {"\u25CB".repeat(5 - effort)}
          </span>
        )}
        <span
          className={`ml-auto text-xs ${STATUS_COLORS[activity.status] ?? ""}`}
        >
          {activity.status}
        </span>
      </div>
      {expanded && activity.description && (
        <div className="mt-2 whitespace-pre-line border-t border-rose-200 pt-2 text-xs text-muted-foreground dark:border-rose-800">
          {activity.description}
        </div>
      )}
    </button>
  );
}
