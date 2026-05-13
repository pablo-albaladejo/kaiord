/**
 * No-workout body renderer for `CoachingActivityDialog`. The matched-
 * state body lives in `coaching-dialog-matched-body.tsx`; both reside
 * in their own files so the dispatcher and each renderer stay under
 * the per-file line cap.
 */
import { AiErrorState } from "./AiErrorState";
import { AiProcessingOverlay } from "./AiProcessingOverlay";
import type { CoachingDialogBodyProps } from "./coaching-dialog-body-props";
import { NoWorkoutActions } from "./NoWorkoutActions";

export type { CoachingDialogBodyProps };
export { renderMatchedBody } from "./coaching-dialog-matched-body";

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
