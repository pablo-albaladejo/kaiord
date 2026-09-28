import { MissingFtpError } from "@kaiord/core";

import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { KRD, ValidationError } from "../../../types/krd";
import { downloadWorkout, exportWorkout } from "../../../utils/export-workout";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getStructuredWorkout } from "../../../utils/structured-workout";
import { generateWorkoutFilename } from "./workout-filename";

const isMissingFtp = (err: unknown): boolean =>
  err instanceof MissingFtpError ||
  (err instanceof Error && err.cause instanceof MissingFtpError);

const exportErrorMessage = (err: unknown, t: Translate): string => {
  if (isMissingFtp(err)) return t("save.missingFtp");
  return err instanceof Error ? err.message : t("save.exportFailedFallback");
};

export function createSaveHandler(
  workout: KRD,
  selectedFormat: WorkoutFileFormat,
  setIsSaving: (saving: boolean) => void,
  setSaveErrors: (errors: Array<ValidationError> | null) => void,
  setExportProgress: (progress: number) => void,
  success: (title: string, description: string) => void,
  showError: (title: string, description: string) => void,
  onExported?: (format: string) => void,
  t: Translate = getTranslate("editor"),
  ftpWatts?: number
) {
  return async () => {
    setIsSaving(true);
    setSaveErrors(null);
    setExportProgress(0);

    try {
      const buffer = await exportWorkout(
        workout,
        selectedFormat,
        (progress) => {
          setExportProgress(progress);
        },
        ftpWatts
      );

      setExportProgress(100);

      const filename = generateWorkoutFilename(workout, selectedFormat);
      downloadWorkout(buffer, filename, selectedFormat);

      const workoutName = getStructuredWorkout(workout)?.name || "workout";
      const formatLabel = selectedFormat.toUpperCase();
      success(
        t("save.savedTitle"),
        t("save.savedDescription", { name: workoutName, format: formatLabel })
      );
      onExported?.(selectedFormat);
    } catch (err) {
      const errorMessage = exportErrorMessage(err, t);
      showError(t("save.exportFailedTitle"), errorMessage);
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
}
