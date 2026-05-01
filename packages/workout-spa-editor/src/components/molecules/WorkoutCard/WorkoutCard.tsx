/**
 * Compact card for executed workouts on the calendar week view.
 *
 * Visual contract is shared with CoachingActivityCard and
 * MatchedSessionCard via CardShell — the workout `state` drives the
 * lateral border colour (stale/raw → amber, structured/skipped →
 * slate, ready/pushed → emerald) and the existing state symbol stays
 * as the in-row indicator with an accessible label.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import { CardShell } from "../CardShell/CardShell";
import { workoutStateToColourClass } from "../CardShell/status-tokens";
import { formatDuration, getStateIndicator } from "./workout-card-utils";

export type WorkoutCardProps = {
  workout: WorkoutRecord;
  onClick: (workout: WorkoutRecord) => void;
};

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const indicator = getStateIndicator(workout.state);
  const title = workout.raw?.title ?? workout.sport;
  const duration = workout.raw?.duration;

  return (
    <CardShell
      borderClass={workoutStateToColourClass(workout.state)}
      ariaLabel={`${title}, ${workout.sport}, ${indicator.label}`}
      onClick={() => onClick(workout)}
      testId={`workout-card-${workout.id}`}
      originChip={workout.source}
      titleRow={
        <>
          <span
            className={indicator.className}
            data-testid="state-indicator"
            role="img"
            aria-label={indicator.label}
            title={indicator.label}
          >
            {indicator.symbol}
          </span>
          <span className="min-w-0 flex-1">{title}</span>
        </>
      }
      metadataRow={
        <>
          <span>{workout.sport}</span>
          {duration && <span>{formatDuration(duration.value)}</span>}
        </>
      }
    />
  );
}
