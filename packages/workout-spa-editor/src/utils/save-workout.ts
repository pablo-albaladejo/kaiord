/**
 * Save Workout Utilities
 *
 * Utilities for saving workouts with validation and error handling.
 *
 * Requirements:
 * - Requirement 6: Save workout as KRD file with validation
 * - Requirement 36: Clear error feedback with retry options
 */

import { stripIds } from "../store/strip-ids";
import type { KRD, ValidationError } from "../types/krd";
import { krdSchema } from "../types/schemas";
import { formatZodError } from "../types/validation";
import { sanitizeFilename, triggerDownload } from "./save-workout.helpers";
import { getStructuredWorkout } from "./structured-workout";

export type SaveResult =
  | { success: true; filename: string }
  | { success: false; errors: Array<ValidationError> };

const resolveFilename = (krd: KRD, override?: string): string => {
  if (override) return override;
  const workoutName = getStructuredWorkout(krd)?.name || "workout";
  return `${sanitizeFilename(workoutName)}.krd`;
};

const saveErrorFromException = (error: unknown): ValidationError => ({
  path: ["save"],
  message:
    error instanceof Error
      ? `Failed to save file: ${error.message}`
      : "Failed to save file: Unknown error",
});

/**
 * Validate and save workout as KRD file.
 *
 * @param krd - KRD workout data to save
 * @param filename - Optional custom filename (defaults to workout name)
 * @returns SaveResult with success status and errors if validation fails
 */
export const saveWorkout = (krd: KRD, filename?: string): SaveResult => {
  // stripIds chokepoint: UIWorkout ids never leak into exported .krd files.
  const portable = stripIds(krd);

  // Validate workout against KRD schema (Requirement 6.1)
  const validationResult = krdSchema.safeParse(portable);
  if (!validationResult.success) {
    return { success: false, errors: formatZodError(validationResult.error) };
  }

  // Generate filename (Requirement 6.5)
  const finalFilename = resolveFilename(krd, filename);
  try {
    // Generate and download KRD JSON file (Requirement 6.2, 6.4)
    const jsonContent = JSON.stringify(validationResult.data, null, 2);
    triggerDownload(jsonContent, finalFilename);
    return { success: true, filename: finalFilename };
  } catch (error) {
    return { success: false, errors: [saveErrorFromException(error)] };
  }
};

/**
 * Format validation errors for user display.
 *
 * @param errors - Array of validation errors
 * @returns User-friendly error messages
 */
export const formatSaveErrors = (
  errors: Array<ValidationError>
): Array<string> => {
  return errors.map((error) => {
    const fieldPath = error.path.join(".");
    const field = fieldPath || "workout";
    return `${field}: ${error.message}`;
  });
};
