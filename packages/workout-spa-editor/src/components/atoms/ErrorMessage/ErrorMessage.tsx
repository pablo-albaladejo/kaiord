/**
 * ErrorMessage Component
 *
 * Displays error messages with optional retry functionality.
 * Used for validation errors, file loading errors, and other user-facing errors.
 *
 * Requirements:
 * - Requirement 7: Display validation errors with field references
 * - Requirement 36: Clear feedback when errors occur
 */

import { AlertCircle } from "lucide-react";
import type { ValidationError } from "../../../types/krd";
import { Icon } from "../Icon/Icon";
import { ErrorActions } from "./ErrorActions";
import { ValidationErrorList } from "./ValidationErrorList";

export type ErrorMessageProps = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
};

export const ErrorMessage = ({
  title,
  message,
  validationErrors,
  onRetry,
  onDismiss,
  className = "",
}: ErrorMessageProps) => {
  return (
    <div
      className={`rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <Icon icon={AlertCircle} size="md" color="danger" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            {title}
          </h3>
          {message && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {message}
            </p>
          )}
          {validationErrors && (
            <ValidationErrorList errors={validationErrors} />
          )}
          <ErrorActions onRetry={onRetry} onDismiss={onDismiss} />
        </div>
      </div>
    </div>
  );
};
