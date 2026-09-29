import { useState } from "react";

import { useAnalytics } from "../../../contexts";
import { useAthleteZones } from "../../../contexts/athlete-zones-context";
import { useToast } from "../../../hooks/use-toast";
import { useTranslate } from "../../../i18n/use-translate";
import { ftpForWorkout } from "../../../lib/athlete";
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
  const analytics = useAnalytics();
  const t = useTranslate("editor");
  // From the page's single live query (EditorPage). Null while it loads or
  // outside a provider, so a %FTP export fails closed with MissingFtpError.
  const profile = useAthleteZones();

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
    ftpForWorkout(profile, workout)
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
