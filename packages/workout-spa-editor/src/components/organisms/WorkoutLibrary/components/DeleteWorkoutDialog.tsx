/**
 * DeleteWorkoutDialog Component
 *
 * Confirmation dialog for workout deletion from library.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "../../../atoms/Button/Button";

type DeleteWorkoutDialogProps = {
  open: boolean;
  workoutName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteWorkoutDialog({
  open,
  workoutName,
  onConfirm,
  onCancel,
}: DeleteWorkoutDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Workout
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete "{workoutName}"? This action cannot
            be undone.
          </Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>Delete</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
