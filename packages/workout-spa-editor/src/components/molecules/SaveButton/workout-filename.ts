import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFileExtension } from "../../../utils/file-format-metadata";
import type { KRD } from "../../../types/krd";

export function sanitizeWorkoutName(name: string): string {
  return name
    .replace(/[^a-z0-9_-]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
    .slice(0, 50);
}

export function generateWorkoutFilename(
  workout: KRD,
  format: WorkoutFileFormat
): string {
  const workoutData = workout.extensions?.workout as
    | { name?: string }
    | undefined;
  const workoutName = workoutData?.name || "workout";
  const sanitizedName = sanitizeWorkoutName(workoutName);
  const extension = getFileExtension(format);
  return `${sanitizedName}.${extension}`;
}
