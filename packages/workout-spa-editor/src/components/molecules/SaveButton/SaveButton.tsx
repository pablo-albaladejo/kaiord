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
import { useState } from "react";
import { useToast } from "../../../hooks/useToast";
import type { KRD, ValidationError } from "../../../types/krd";
import { downloadWorkout, exportWorkout } from "../../../utils/export-workout";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFileExtension } from "../../../utils/file-format-metadata";
import { Button } from "../../atoms/Button/Button";
import { Toast } from "../../atoms/Toast";
import { ExportFormatSelector } from "../ExportFormatSelector/ExportFormatSelector";
import { SaveErrorDialog } from "../SaveErrorDialog/SaveErrorDialog";

export type SaveButtonProps = {
  workout: KRD;
  disabled?: boolean;
  className?: string;
};

/**
 * Custom hook for save functionality with format selection
 */
function useSaveWorkout(workout: KRD) {
  const [saveErrors, setSaveErrors] = useState<Array<ValidationError> | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] =
    useState<WorkoutFileFormat>("krd");
  const toast = useToast();
  const { success, error: showError } = toast;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveErrors(null);
    setExportProgress(0);

    try {
      // Export workout to selected format with progress tracking
      const buffer = await exportWorkout(
        workout,
        selectedFormat,
        (progress) => {
          setExportProgress(progress);
        }
      );

      setExportProgress(100);

      // Generate filename with correct extension
      const workoutData = workout.extensions?.workout as
        | { name?: string }
        | undefined;
      const workoutName = workoutData?.name || "workout";
      const sanitizedName = workoutName
        .replace(/[^a-z0-9_-]/gi, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .toLowerCase()
        .slice(0, 50);
      const extension = getFileExtension(selectedFormat);
      const filename = `${sanitizedName}.${extension}`;

      // Trigger download
      downloadWorkout(buffer, filename, selectedFormat);

      // Show success notification with format name
      const formatLabel = selectedFormat.toUpperCase();
      success(
        "Workout Saved",
        `"${workoutName}" has been saved as ${formatLabel}`
      );
    } catch (err) {
      // Handle export errors
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export workout";
      showError("Export Failed", errorMessage);
      setSaveErrors([
        {
          path: ["export"],
          message: errorMessage,
        },
      ]);
    } finally {
      setIsSaving(false);
      setExportProgress(0);
    }
  };

  const clearErrors = () => setSaveErrors(null);

  return {
    saveErrors,
    isSaving,
    exportProgress,
    handleSave,
    clearErrors,
    selectedFormat,
    setSelectedFormat,
    toast, // Return the toast instance so SaveButton can use the same one
  };
}

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
          className={className}
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

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          action={toast.action}
          open={toast.open}
          onOpenChange={(open) => {
            if (!open) dismiss(toast.id);
          }}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}
