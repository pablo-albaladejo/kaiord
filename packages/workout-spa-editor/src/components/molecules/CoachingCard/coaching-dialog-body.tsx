/**
 * Body renderers for `CoachingActivityDialog`. Split out from the
 * dispatcher so it stays under the per-file line cap.
 */
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { AiErrorState } from "./AiErrorState";
import { AiProcessingOverlay } from "./AiProcessingOverlay";
import { LinkedWorkoutSection } from "./LinkedWorkoutSection";
import { MatchedActions } from "./MatchedActions";
import { NoWorkoutActions } from "./NoWorkoutActions";
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
  onPushToGarmin: () => void;
  onSplit: () => void;
};

export const renderNoWorkoutBody = (props: CoachingDialogBodyProps) => {
  if (props.aiProcessing)
    return <AiProcessingOverlay onCancel={props.onAiCancel} />;
  if (props.aiFailure)
    return (
      <AiErrorState
        reason={props.aiFailure.reason}
        detail={props.aiFailure.error}
        onRetry={props.onAiProcess}
        onEditManually={props.onEditManually}
        onMatchExisting={props.onOpenPicker}
        onClose={props.onClose}
      />
    );
  return (
    <NoWorkoutActions
      activity={props.activity}
      matching={props.matching}
      pickerOpen={props.pickerOpen}
      pickerWorkouts={props.pickerWorkouts}
      creatingManual={props.manualCreating}
      onClose={props.onClose}
      onAiProcess={props.onAiProcess}
      onEditManually={props.onEditManually}
      onOpenPicker={props.onOpenPicker}
      onClosePicker={props.onClosePicker}
      onSelectWorkout={props.onSelectWorkout}
    />
  );
};

export const renderMatchedBody = (
  props: CoachingDialogBodyProps,
  workout: WorkoutRecord
) => (
  <>
    <LinkedWorkoutSection
      workout={workout}
      splitting={false}
      onSplit={() => undefined}
    />
    <MatchedActions
      workout={workout}
      splitting={props.splitting}
      onClose={props.onClose}
      onOpenEditor={props.onOpenEditor}
      onAiProcess={props.onAiProcess}
      onPushToGarmin={props.onPushToGarmin}
      onSplit={props.onSplit}
    />
  </>
);
