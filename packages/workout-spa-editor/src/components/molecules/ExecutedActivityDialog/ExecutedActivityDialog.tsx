/**
 * ExecutedActivityDialog - Read-only preview for a projected activity
 * (an execution with no persisted WorkoutRecord). The record is already
 * in memory (projected on the fly from `activities`), so there is no
 * fetch to fail; the dialog only ever shows real data.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import type { WorkoutRecord } from "../../../types/calendar-record";
import {
  formatDistance,
  formatDuration,
} from "../../organisms/WorkoutStats/format-helpers";

export type ExecutedActivityDialogProps = {
  workout: WorkoutRecord | null;
  onClose: () => void;
};

export function ExecutedActivityDialog({
  workout,
  onClose,
}: ExecutedActivityDialogProps) {
  return (
    <Dialog.Root
      open={workout !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <Dialog.Description className="sr-only">
            Recorded activity details. Executions are read-only and cannot be
            edited or rescheduled.
          </Dialog.Description>
          {workout && (
            <div data-testid="executed-activity-dialog" className="space-y-3">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold">
                  {workout.raw?.title ?? workout.sport}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="rounded p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recorded {workout.sport} on {workout.date}
              </p>
              <div className="flex gap-4 text-sm">
                {workout.raw?.duration && (
                  <span data-testid="executed-activity-duration">
                    {formatDuration(workout.raw.duration.value)}
                  </span>
                )}
                {workout.raw?.distance && (
                  <span data-testid="executed-activity-distance">
                    {formatDistance(workout.raw.distance.value)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                This is a completed execution — recorded data is read-only.
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
