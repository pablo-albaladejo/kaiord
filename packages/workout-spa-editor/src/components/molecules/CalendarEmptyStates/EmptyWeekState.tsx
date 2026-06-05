/**
 * EmptyWeekState - No workouts this week, but data exists elsewhere.
 */

import { Calendar, Plus } from "lucide-react";
import { useLocation } from "wouter";

import { withOrigin } from "../../../routing/with-origin";
import { Button } from "../../atoms/Button/Button";

export type EmptyWeekStateProps = {
  /** The rendered week's id, carried on `?week=` so Back returns here. */
  weekId: string;
  onGoToLatest?: () => void;
};

export function EmptyWeekState({ weekId, onGoToLatest }: EmptyWeekStateProps) {
  const [, navigate] = useLocation();

  return (
    <div
      data-testid="empty-week-state"
      className="flex flex-col items-center gap-4 py-12"
    >
      <Calendar className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground">No workouts this week</p>
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            navigate(withOrigin("/workout/new", "calendar", { week: weekId }))
          }
        >
          <Plus className="h-4 w-4" />
          Add workout
        </Button>
        {onGoToLatest && (
          <Button variant="secondary" size="sm" onClick={onGoToLatest}>
            Go to latest
          </Button>
        )}
      </div>
    </div>
  );
}
