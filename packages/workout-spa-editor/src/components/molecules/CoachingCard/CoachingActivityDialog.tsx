/**
 * CoachingActivityDialog — read-only detail view + AI/Manual/Match
 * actions, dispatching on the 3-state `dialogState` (per design D5).
 *
 * Lazy-loads description when undefined (a persisted "" is "known empty"
 * and does NOT re-fire). The hook captures `targetProfileId` at open so
 * a profile switch does not reroute writes.
 */

import { useCallback, useMemo } from "react";
import { useLocation } from "wouter";

import { usePickableWorkouts } from "../../../hooks/use-pickable-workouts";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useGarminPush } from "../GarminPushButton/useGarminPush";
import { buildCoachingDialogCloseHandler } from "./build-coaching-dialog-close-handler";
import { CoachingDialogShell } from "./coaching-dialog-shell";
import { CoachingActivityDialogContent } from "./CoachingActivityDialogContent";
import { useCoachingDialog } from "./use-coaching-dialog";
import { useOpenExecutedHandler } from "./use-open-executed-handler";

export type CoachingActivityDialogProps = {
  activity: CoachingActivity | null;
  onClose: () => void;
  expandActivity: (activity: CoachingActivity) => void;
  onOpenExecuted?: (workout: WorkoutRecord) => void;
};

export function CoachingActivityDialog({
  activity,
  onClose,
  expandActivity,
  onOpenExecuted,
}: CoachingActivityDialogProps) {
  const dialog = useCoachingDialog(activity, onClose, expandActivity);
  const pickable = usePickableWorkouts(
    dialog.targetProfileId,
    activity?.date ?? null,
    activity?.sport.label ?? null
  );
  const [, navigate] = useLocation();
  const matchedWorkout =
    dialog.dialogState?.kind === "matched" ? dialog.dialogState.workout : null;
  const matchedId = matchedWorkout?.id ?? null;
  const onOpenEditor = useCallback(() => {
    if (matchedId) {
      onClose();
      navigate(`/workout/${matchedId}`);
    }
  }, [matchedId, navigate, onClose]);
  const { push: pushToGarmin } = useGarminPush(matchedWorkout ?? undefined);
  const onPushToGarmin = useCallback(() => {
    void pushToGarmin();
  }, [pushToGarmin]);
  const { cancelAi } = dialog.ai;
  const handleDialogClose = useMemo(
    () => buildCoachingDialogCloseHandler(cancelAi, onClose),
    [cancelAi, onClose]
  );
  const handleOpenExecuted = useOpenExecutedHandler(onClose, onOpenExecuted);

  if (!activity) return null;

  return (
    <CoachingDialogShell onClose={handleDialogClose}>
      <CoachingActivityDialogContent
        activity={activity}
        dialogState={dialog.dialogState}
        pickerOpen={dialog.pickerOpen}
        pickerWorkouts={pickable ?? []}
        matching={dialog.matching}
        splitting={dialog.splitting}
        aiProcessing={dialog.ai.processing}
        aiFailure={dialog.ai.failure}
        manualCreating={dialog.manual.creating}
        onClose={handleDialogClose}
        onAiProcess={dialog.ai.startAi}
        onAiCancel={dialog.ai.cancelAi}
        onEditManually={dialog.manual.startManual}
        onOpenPicker={dialog.openPicker}
        onClosePicker={dialog.closePicker}
        onSelectWorkout={dialog.handleSelectWorkout}
        onOpenEditor={onOpenEditor}
        onOpenExecuted={handleOpenExecuted}
        onPushToGarmin={onPushToGarmin}
        onSplit={dialog.handleSplit}
      />
    </CoachingDialogShell>
  );
}
