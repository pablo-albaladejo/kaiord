/**
 * Load Confirm Dialog Component
 *
 * Confirmation dialog when loading a workout would replace current workout.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { WorkoutTemplate } from "../../../../types/workout-library";
import { Button } from "../../../atoms/Button";

type LoadConfirmDialogProps = {
  template: WorkoutTemplate | null;
  onConfirm: (template: WorkoutTemplate) => void;
  onCancel: () => void;
};

export function LoadConfirmDialog({
  template,
  onConfirm,
  onCancel,
}: LoadConfirmDialogProps) {
  if (!template) return null;

  return (
    <Dialog.Root open={!!template} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Replace Current Workout?
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading this workout will replace your current workout. Any unsaved
            changes will be lost. Are you sure you want to continue?
          </Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onConfirm(template)}>Load Workout</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
