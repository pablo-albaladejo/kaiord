import type { KRD, ValidationError } from "../../../types/krd";
import { downloadWorkout, exportWorkout } from "../../../utils/export-workout";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { generateWorkoutFilename } from "./workout-filename";

export function createSaveHandler(
  workout: KRD,
  selectedFormat: WorkoutFileFormat,
  setIsSaving: (saving: boolean) => void,
  setSaveErrors: (errors: Array<ValidationError> | null) => void,
  setExportProgress: (progress: number) => void,
  success: (title: string, description: string) => void,
  showError: (title: string, description: string) => void
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

      const workoutData = workout.extensions?.workout as
        | { name?: string }
        | undefined;
      const workoutName = workoutData?.name || "workout";
      const formatLabel = selectedFormat.toUpperCase();
      success(
        "Workout Saved",
        `"${workoutName}" has been saved as ${formatLabel}`
      );
    } catch (err) {
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
}

