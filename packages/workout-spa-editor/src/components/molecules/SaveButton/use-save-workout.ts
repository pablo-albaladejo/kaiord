import { useState } from "react";
import { useToast } from "../../../hooks/useToast";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { createSaveHandler } from "./save-handler";

/**
 * Custom hook for save functionality with format selection
 */
export function useSaveWorkout(workout: KRD) {
  const [saveErrors, setSaveErrors] = useState<Array<ValidationError> | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] =
    useState<WorkoutFileFormat>("krd");
  const toast = useToast();
  const { success, error: showError } = toast;

  const handleSave = createSaveHandler(
    workout,
    selectedFormat,
    setIsSaving,
    setSaveErrors,
    setExportProgress,
    success,
    showError
  );

  const clearErrors = () => setSaveErrors(null);

  return {
    saveErrors,
    isSaving,
    exportProgress,
    handleSave,
    clearErrors,
    selectedFormat,
    setSelectedFormat,
    toast,
  };
}
