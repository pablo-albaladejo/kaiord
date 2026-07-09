import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { KRD, ValidationError } from "../../../types/krd";
import { downloadWorkout, exportWorkout } from "../../../utils/export-workout";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getStructuredWorkout } from "../../../utils/structured-workout";
import { generateWorkoutFilename } from "./workout-filename";

export function createSaveHandler(
  workout: KRD,
  selectedFormat: WorkoutFileFormat,
  setIsSaving: (saving: boolean) => void,
  setSaveErrors: (errors: Array<ValidationError> | null) => void,
  setExportProgress: (progress: number) => void,
  success: (title: string, description: string) => void,
  showError: (title: string, description: string) => void,
  onExported?: (format: string) => void,
  t: Translate = getTranslate("editor")
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
        }
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
      const errorMessage =
        err instanceof Error ? err.message : t("save.exportFailedFallback");
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
