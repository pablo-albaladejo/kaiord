/**
 * CoachingActivityDialog — read-only detail view for a coaching activity.
 *
 * Replaces the in-place description toggle on CoachingActivityCard.
 * Lazy-loads description when undefined (a persisted "" is "known empty"
 * and does NOT re-fire). "Convert to workout" routes to the editor on
 * success; on failure stays open with an inline error.
 */

import * as Dialog from "@radix-ui/react-dialog";

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
  const { error, converting, handleConvert } = useCoachingDialog(
    activity,
    onClose,
    expandActivity
  );

  if (!activity) return null;
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
            error={error}
            converting={converting}
            onClose={onClose}
            onConvert={handleConvert}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
