import { useState } from "react";

import { useAnalytics } from "../../../contexts";
import { useExportProfile } from "../../../hooks/use-export-profile";
import { useToast } from "../../../hooks/use-toast";
import { useTranslate } from "../../../i18n/use-translate";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { createSaveHandler } from "./save-handler";

/**
 * Custom hook for save functionality with format selection.
 * `ownerProfileId`: the profile owning the persisted record, if any.
 */
export function useSaveWorkout(workout: KRD, ownerProfileId?: string) {
  const [saveErrors, setSaveErrors] = useState<Array<ValidationError> | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] =
    useState<WorkoutFileFormat>("krd");
  const toast = useToast();
  const { success, error: showError } = toast;
  const analytics = useAnalytics();
  const t = useTranslate("editor");
  const profile = useExportProfile(ownerProfileId);

  const handleSave = createSaveHandler(
    workout,
    selectedFormat,
    setIsSaving,
    setSaveErrors,
    setExportProgress,
    success,
    showError,
    (format) => analytics.event("workout-exported", { format }),
    t,
    profile
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
