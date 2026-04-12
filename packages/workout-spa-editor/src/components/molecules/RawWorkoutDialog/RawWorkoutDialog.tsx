/**
 * RawWorkoutDialog - Detail view for a RAW workout.
 *
 * Shows coach description, selectable comments, action buttons.
 */

import * as Dialog from "@radix-ui/react-dialog";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { RawWorkoutContent } from "./RawWorkoutContent";

export type RawWorkoutDialogProps = {
  workout: WorkoutRecord | null;
  onClose: () => void;
  onProcess: (workoutId: string, commentIndices: number[]) => void;
  onSkip: (workoutId: string) => void;
  onUnskip: (workoutId: string) => void;
};

export function RawWorkoutDialog({
  workout,
  onClose,
  onProcess,
  onSkip,
  onUnskip,
}: RawWorkoutDialogProps) {
  return (
    <Dialog.Root
      open={workout !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          {workout && (
            <RawWorkoutContent
              workout={workout}
              onProcess={onProcess}
              onSkip={onSkip}
              onUnskip={onUnskip}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
