/**
 * CoachingActivityDialog — read-only detail view + match/split actions.
 *
 * Replaces the in-place description toggle on CoachingActivityCard.
 * Lazy-loads description when undefined (a persisted "" is "known empty"
 * and does NOT re-fire). Solo-plan state offers "Convert to workout" and
 * "Match to…"; matched state hides Convert and surfaces "Linked workout"
 * + "Split". Profile id is captured at dialog open so a profile switch
 * does not reroute writes.
 */

import * as Dialog from "@radix-ui/react-dialog";

import { usePickableWorkouts } from "../../../hooks/use-pickable-workouts";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { CoachingActivityDialogContent } from "./CoachingActivityDialogContent";
import { useCoachingDialog } from "./use-coaching-dialog";

export type CoachingActivityDialogProps = {
  activity: CoachingActivity | null;
  onClose: () => void;
  expandActivity: (activity: CoachingActivity) => void;
};

export function CoachingActivityDialog({
  activity,
  onClose,
  expandActivity,
}: CoachingActivityDialogProps) {
  const dialog = useCoachingDialog(activity, onClose, expandActivity);
  const pickable = usePickableWorkouts(
    dialog.targetProfileId,
    activity?.date ?? null,
    activity?.sport.label ?? null
  );

  if (!activity) return null;

  const matched = dialog.matchState?.kind === "matched";
  const matchedWorkout =
    dialog.matchState?.kind === "matched" ? dialog.matchState.workout : null;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          data-testid="coaching-activity-dialog"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        >
          <CoachingActivityDialogContent
            activity={activity}
            error={dialog.error}
            converting={dialog.converting}
            matched={matched}
            matchedWorkout={matchedWorkout}
            matching={dialog.matching}
            splitting={dialog.splitting}
            pickerOpen={dialog.pickerOpen}
            pickerWorkouts={pickable ?? []}
            onClose={onClose}
            onConvert={dialog.handleConvert}
            onOpenPicker={dialog.openPicker}
            onClosePicker={dialog.closePicker}
            onSelectWorkout={dialog.handleSelectWorkout}
            onSplit={dialog.handleSplit}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
