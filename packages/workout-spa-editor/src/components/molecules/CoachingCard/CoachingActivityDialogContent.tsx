/**
 * Inner JSX for CoachingActivityDialog. The dialog body switches between
 * solo-plan (Convert + Match-to) and matched (LinkedWorkout + Split)
 * modes based on `matchState`.
 *
 * Sub-components live in coaching-dialog-parts.tsx + dedicated files
 * (`MatchToPicker`, `LinkedWorkoutSection`) so this file stays under the
 * lint-enforced size limits.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  DialogDescription,
  DialogHeader,
  DialogMeta,
  STATUS_LABEL,
} from "./coaching-dialog-parts";
import { CoachingDialogActions } from "./CoachingDialogActions";
import { LinkedWorkoutSection } from "./LinkedWorkoutSection";

export type CoachingActivityDialogContentProps = {
  activity: CoachingActivity;
  error: string | null;
  converting: boolean;
  matched: boolean;
  matchedWorkout: WorkoutRecord | null;
  matching: boolean;
  splitting: boolean;
  pickerOpen: boolean;
  pickerWorkouts: WorkoutRecord[];
  onClose: () => void;
  onConvert: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelectWorkout: (workoutId: string) => void;
  onSplit: () => void;
};

export function CoachingActivityDialogContent(
  props: CoachingActivityDialogContentProps
) {
  const { activity, error, matched, matchedWorkout, splitting } = props;
  return (
    <div className="space-y-3">
      <DialogHeader activity={activity} />
      <DialogMeta activity={activity} />
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">
          {STATUS_LABEL[activity.status] ?? activity.status}
        </span>
      </div>
      <DialogDescription activity={activity} />
      {matched && matchedWorkout && (
        <LinkedWorkoutSection
          workout={matchedWorkout}
          splitting={splitting}
          onSplit={props.onSplit}
        />
      )}
      {error && (
        <p data-testid="coaching-dialog-error" className="text-xs text-red-500">
          {error}
        </p>
      )}
      <CoachingDialogActions {...props} />
    </div>
  );
}
