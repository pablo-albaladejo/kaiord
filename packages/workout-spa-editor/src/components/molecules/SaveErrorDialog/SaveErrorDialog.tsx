/**
 * SaveErrorDialog Component
 *
 * Displays validation errors when saving a workout fails.
 *
 * Requirements:
 * - Requirement 6.3: Display specific validation errors with field references
 * - Requirement 36: Clear error feedback with retry options
 */

import { AlertCircle, X } from "lucide-react";
import type { ValidationError } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";

export type SaveErrorDialogProps = {
  errors: Array<ValidationError>;
  onClose: () => void;
  onRetry: () => void;
};

/**
 * Dialog header with title and close button
 */
function DialogHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Save Failed
        </h2>
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

/**
 * Error list display
 */
function ErrorList({ errors }: { errors: Array<ValidationError> }) {
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
      {errors.map((error, index) => (
        <div
          key={index}
          className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200"
        >
          <span className="mt-0.5 flex-shrink-0">•</span>
          <div>
            {error.path.length > 0 && (
              <span className="font-medium">{error.path.join(".")}: </span>
            )}
            <span>{error.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dialog showing save validation errors with retry option
 */
export function SaveErrorDialog({
  errors,
  onClose,
  onRetry,
}: SaveErrorDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <DialogHeader onClose={onClose} />

        <div className="p-4">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            The workout could not be saved due to validation errors. Please fix
            the following issues and try again:
          </p>
          <ErrorList errors={errors} />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onRetry}>
            Fix and Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
