/**
 * RawWorkoutContent - Inner content of the RAW workout dialog.
 */

import { useLocation } from "wouter";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { CommentSelector } from "./CommentSelector";
import { useCommentSelection } from "./raw-workout-hooks";
import { RawWorkoutActions } from "./RawWorkoutActions";
import { RawWorkoutHeader } from "./RawWorkoutHeader";

export type RawWorkoutContentProps = {
  workout: WorkoutRecord;
  onProcess: (workoutId: string, commentIndices: number[]) => void;
  onSkip: (workoutId: string) => void;
  onUnskip: (workoutId: string) => void;
};

export function RawWorkoutContent({
  workout,
  onProcess,
  onSkip,
  onUnskip,
}: RawWorkoutContentProps) {
  const raw = workout.raw;
  const comments = raw?.comments ?? [];
  const { selected, toggle } = useCommentSelection(comments, workout.date);
  const [, navigate] = useLocation();

  return (
    <div data-testid="raw-workout-dialog" className="space-y-4">
      <RawWorkoutHeader title={raw?.title ?? workout.sport} />
      {raw?.description && (
        <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900">
          {raw.description}
        </div>
      )}
      <CommentSelector
        comments={comments}
        selected={selected}
        onToggle={toggle}
      />
      <RawWorkoutActions
        workout={workout}
        selected={selected}
        onProcess={onProcess}
        onSkip={onSkip}
        onUnskip={onUnskip}
        onManual={() => navigate(`/workout/new?date=${workout.date}`)}
      />
    </div>
  );
}
