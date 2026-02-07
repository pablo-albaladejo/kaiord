import { AlertCircle } from "lucide-react";
import { getFormatWarnings } from "./format-helpers";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

type FormatWarningsProps = {
  readonly format: WorkoutFileFormat;
  readonly workout?: KRD;
  readonly validationErrors: readonly ValidationError[];
};

export function FormatWarnings({
  format,
  workout,
  validationErrors,
}: FormatWarningsProps) {
  const warning = getFormatWarnings(format, workout);

  return (
    <>
      {warning && (
        <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {warning}
          </p>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            Cannot export workout:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
            {validationErrors.map((error) => {
              const errorKey = error.path.join(".") || error.message;
              return (
                <li key={errorKey}>
                  {error.path.join(".")}: {error.message}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
