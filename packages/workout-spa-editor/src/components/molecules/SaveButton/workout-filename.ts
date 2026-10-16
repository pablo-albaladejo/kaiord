import type { KRD } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFileExtension } from "../../../utils/file-format-metadata";
import { sanitizeFilename } from "../../../utils/save-workout.helpers";

export function generateWorkoutFilename(
  workout: KRD,
  format: WorkoutFileFormat
): string {
  const workoutData = workout.extensions?.structured_workout as
    { name?: string } | undefined;
  const workoutName = workoutData?.name || "workout";
  return `${sanitizeFilename(workoutName)}.${getFileExtension(format)}`;
}
