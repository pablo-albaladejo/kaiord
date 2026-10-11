import { useState } from "react";

import { useAnalytics } from "../../../contexts";
import { resolveExportProfile } from "../../../hooks/resolve-export-profile";
import { useToast } from "../../../hooks/use-toast";
import { useTranslate } from "../../../i18n/use-translate";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { createSaveHandler } from "./save-handler";

/**
 * Custom hook for save functionality with format selection.
 * `ownerProfileId`: the profile owning the persisted record, if any.
 * `initialFormat` preselects the export format (the converter deep link
 * passes its `to`); the user can still change it.
 */
export function useSaveWorkout(
  workout: KRD,
  ownerProfileId?: string,
  initialFormat: WorkoutFileFormat = "krd"
) {
  const [saveErrors, setSaveErrors] = useState<Array<ValidationError> | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] =
    useState<WorkoutFileFormat>(initialFormat);
  const toast = useToast();
  const { success, error: showError } = toast;
  const analytics = useAnalytics();
  const t = useTranslate("editor");

  const handlerFor = (format: WorkoutFileFormat) =>
    createSaveHandler(
      workout,
      format,
      setIsSaving,
      setSaveErrors,
      setExportProgress,
      success,
      showError,
      (exported) => analytics.event("workout-exported", { format: exported }),
      t,
      () => resolveExportProfile(ownerProfileId)
    );
  const handleSave = handlerFor(selectedFormat);
  /** Picks the format and downloads it in one step. */
  const downloadAs = (format: WorkoutFileFormat) => {
    setSelectedFormat(format);
    return handlerFor(format)();
  };

  const clearErrors = () => setSaveErrors(null);

  return {
    saveErrors,
    isSaving,
    exportProgress,
    handleSave,
    downloadAs,
    clearErrors,
    selectedFormat,
    setSelectedFormat,
    toast,
  };
}
