/**
 * Shared prop bundle for the matched / no-workout body renderers of
 * `CoachingActivityDialog`. Lives in its own file so both
 * `coaching-dialog-body.tsx` (no-workout) and
 * `coaching-dialog-matched-body.tsx` (matched) can stay under the
 * per-file line cap.
 */

import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { AiFailureState } from "./use-coaching-ai-handler";

export type CoachingDialogBodyProps = {
  activity: CoachingActivity;
  pickerOpen: boolean;
  pickerWorkouts: WorkoutRecord[];
  matching: boolean;
  splitting: boolean;
  aiProcessing: boolean;
  aiFailure: AiFailureState | null;
  manualCreating: boolean;
  onClose: () => void;
  onAiProcess: () => void;
  onAiCancel: () => void;
  onEditManually: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelectWorkout: (workoutId: string) => void;
  onOpenEditor: () => void;
  onOpenExecuted: (workout: WorkoutRecord) => void;
  onPushToGarmin: () => void;
  onSplit: () => void;
};
