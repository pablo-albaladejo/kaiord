/**
 * SaveButton Component
 *
 * Button with integrated save functionality and error handling.
 *
 * Requirements:
 * - Requirement 6: Save workout as KRD file
 * - Requirement 12.6: Provide format selection options (FIT, TCX, ZWO, KRD)
 * - Requirement 12.10: Generate correct file extension based on format
 * - Requirement 36: Clear error feedback with retry options
 */

import { Download } from "lucide-react";
import { SaveButtonToasts } from "./SaveButtonToasts";
import { useSaveWorkout } from "./use-save-workout";
import { Button } from "../../atoms/Button/Button";
import { ExportFormatSelector } from "../ExportFormatSelector/ExportFormatSelector";
import { SaveErrorDialog } from "../SaveErrorDialog/SaveErrorDialog";
import type { KRD } from "../../../types/krd";

export type SaveButtonProps = {
  workout: KRD;
  disabled?: boolean;
  className?: string;
};

/**
 * Button that saves workout with format selection and error handling
 */
export function SaveButton({ workout, disabled, className }: SaveButtonProps) {
  const {
    saveErrors,
    isSaving,
    exportProgress,
    handleSave,
    clearErrors,
    selectedFormat,
    setSelectedFormat,
    toast,
  } = useSaveWorkout(workout);
  const { toasts, dismiss } = toast;

  const showProgress = isSaving && exportProgress > 0 && exportProgress < 100;

  return (
    <div className="space-y-4">
      <ExportFormatSelector
        currentFormat={selectedFormat}
        onFormatChange={setSelectedFormat}
        workout={workout}
        disabled={disabled || isSaving}
      />

      <div className="space-y-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={disabled || isSaving}
          className={`w-full sm:w-auto ${className || ""}`}
        >
          {isSaving ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Workout"}
        </Button>

        {showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
              role="progressbar"
              aria-valuenow={exportProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Export progress: ${exportProgress}%`}
            />
          </div>
        )}
      </div>

      {saveErrors && saveErrors.length > 0 && (
        <SaveErrorDialog
          errors={saveErrors}
          onClose={clearErrors}
          onRetry={clearErrors}
        />
      )}

      <SaveButtonToasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
