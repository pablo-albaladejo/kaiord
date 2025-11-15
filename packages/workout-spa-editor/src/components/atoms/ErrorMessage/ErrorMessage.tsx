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
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";

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
          {validationErrors && validationErrors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Validation errors:
              </p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
                {validationErrors.map((error, index) => {
                  const fieldPath = error.path.join(".");
                  return (
                    <li key={index}>
                      {fieldPath && (
                        <>
                          <span className="font-mono text-xs">{fieldPath}</span>
                          :{" "}
                        </>
                      )}
                      {error.message}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="secondary"
                  size="sm"
                  className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
                >
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
