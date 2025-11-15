/**
 * Save Workout Utilities
 *
 * Utilities for saving workouts with validation and error handling.
 *
 * Requirements:
 * - Requirement 6: Save workout as KRD file with validation
 * - Requirement 36: Clear error feedback with retry options
 */

import type { KRD, ValidationError } from "../types/krd";
import { krdSchema } from "../types/schemas";
import { formatZodError } from "../types/validation";

// ============================================
// Types
// ============================================

export type SaveResult =
  | { success: true; filename: string }
  | { success: false; errors: Array<ValidationError> };

// ============================================
// Save Functions
// ============================================

/**
 * Validate and save workout as KRD file
 *
 * @param krd - KRD workout data to save
 * @param filename - Optional custom filename (defaults to workout name)
 * @returns SaveResult with success status and errors if validation fails
 */
/**
 * Trigger browser download of file
 */
const triggerDownload = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: "application/vnd.kaiord+json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const saveWorkout = (krd: KRD, filename?: string): SaveResult => {
  // Validate workout against KRD schema (Requirement 6.1)
  const validationResult = krdSchema.safeParse(krd);

  if (!validationResult.success) {
    return {
      success: false,
      errors: formatZodError(validationResult.error),
    };
  }

  // Generate filename (Requirement 6.5)
  const workoutName =
    (krd.extensions?.workout as { name?: string })?.name || "workout";
  const finalFilename = filename || `${sanitizeFilename(workoutName)}.krd`;

  try {
    // Generate and download KRD JSON file (Requirement 6.2, 6.4)
    const jsonContent = JSON.stringify(validationResult.data, null, 2);
    triggerDownload(jsonContent, finalFilename);

    return {
      success: true,
      filename: finalFilename,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          path: ["save"],
          message:
            error instanceof Error
              ? `Failed to save file: ${error.message}`
              : "Failed to save file: Unknown error",
        },
      ],
    };
  }
};

/**
 * Sanitize filename for safe file system usage
 */
const sanitizeFilename = (name: string): string => {
  return (
    name
      .replace(/[^a-z0-9_-]/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase()
      .slice(0, 50) || "workout"
  );
};

/**
 * Format validation errors for user display
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
