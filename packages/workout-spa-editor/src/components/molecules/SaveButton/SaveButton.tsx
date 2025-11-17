/**
 * SaveButton Component
 *
 * Button with integrated save functionality and error handling.
 *
 * Requirements:
 * - Requirement 6: Save workout as KRD file
 * - Requirement 36: Clear error feedback with retry options
 */

import { Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "../../../hooks/useToast";
import type { KRD, ValidationError } from "../../../types/krd";
import { saveWorkout } from "../../../utils/save-workout";
import { Button } from "../../atoms/Button/Button";
import { Toast } from "../../atoms/Toast";
import { SaveErrorDialog } from "../SaveErrorDialog/SaveErrorDialog";

export type SaveButtonProps = {
  workout: KRD;
  disabled?: boolean;
  className?: string;
};

/**
 * Custom hook for save functionality
 */
function useSaveWorkout(workout: KRD) {
  const [saveErrors, setSaveErrors] = useState<Array<ValidationError> | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const { success } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    const result = saveWorkout(workout);

    if (result.success) {
      setSaveErrors(null);
      // Show success notification (Requirement 39.1)
      const workoutData = workout.extensions?.workout as
        | { name?: string }
        | undefined;
      const workoutName = workoutData?.name || "Untitled Workout";
      success("Workout Saved", `"${workoutName}" has been saved successfully`);
    } else {
      // Type guard ensures result has errors property
      setSaveErrors(result.errors);
    }

    setIsSaving(false);
  };

  const clearErrors = () => setSaveErrors(null);

  return { saveErrors, isSaving, handleSave, clearErrors };
}

/**
 * Button that saves workout with validation and error handling
 */
export function SaveButton({ workout, disabled, className }: SaveButtonProps) {
  const { saveErrors, isSaving, handleSave, clearErrors } =
    useSaveWorkout(workout);
  const { toasts, dismiss } = useToast();

  return (
    <>
      <Button
        variant="primary"
        onClick={handleSave}
        disabled={disabled || isSaving}
        className={className}
      >
        <Download className="h-4 w-4" />
        {isSaving ? "Saving..." : "Save Workout"}
      </Button>

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
    </>
  );
}
