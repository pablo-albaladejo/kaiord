/**
 * DeleteConfirmDialog Component
 *
 * Confirmation dialog for deleting workout steps.
 *
 * Requirements:
 * - Requirement 5.1: Display confirmation dialog when user selects step for deletion
 * - Requirement 5.2: Remove step from workout structure when user confirms
 */

import { AlertTriangle, X } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

export type DeleteConfirmDialogProps = {
  stepIndex: number;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Dialog header with title and close button
 */
function DialogHeader({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Delete Step
        </h2>
      </div>
      <button
        onClick={onCancel}
        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

/**
 * Confirmation dialog for deleting a workout step
 */
export function DeleteConfirmDialog({
  stepIndex,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <DialogHeader onCancel={onCancel} />

        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete Step {stepIndex + 1}? This action
            cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete Step
          </Button>
        </div>
      </div>
    </div>
  );
}
