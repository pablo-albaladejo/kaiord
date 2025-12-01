/**
 * ValidationErrors Component
 *
 * Displays zone validation errors.
 */

import { AlertCircle } from "lucide-react";

type ZoneValidationError = {
  zone: number;
  message: string;
};

type ValidationErrorsProps = {
  errors: Array<ZoneValidationError>;
};

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
            Validation Errors
          </h3>
          <ul className="mt-1 space-y-1 text-sm text-red-700 dark:text-red-300">
            {errors.map((error) => (
              <li key={`${error.zone}-${error.message}`}>
                Zone {error.zone}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
