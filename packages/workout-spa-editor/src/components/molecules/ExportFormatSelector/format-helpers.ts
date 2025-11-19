import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

type FormatWarning = {
  format: WorkoutFileFormat;
  message: string;
};

/**
 * Gets format-specific warnings based on workout content
 */
export const getFormatWarnings = (
  format: WorkoutFileFormat,
  workout?: KRD
): string | null => {
  if (!workout) return null;

  const warnings: FormatWarning[] = [
    {
      format: "fit",
      message: "FIT format may not support all workout features",
    },
    {
      format: "tcx",
      message: "TCX format has limited support for advanced targets",
    },
    {
      format: "zwo",
      message: "ZWO format only supports cycling workouts",
    },
  ];

  const warning = warnings.find((w) => w.format === format);
  return warning?.message || null;
};

/**
 * Validates workout before export
 */
export const validateWorkoutForExport = (workout?: KRD): ValidationError[] => {
  if (!workout) {
    return [{ path: ["workout"], message: "No workout to export" }];
  }

  const errors: ValidationError[] = [];

  if (!workout.version) {
    errors.push({ path: ["version"], message: "Missing version" });
  }

  if (!workout.type) {
    errors.push({ path: ["type"], message: "Missing type" });
  }

  if (!workout.metadata) {
    errors.push({ path: ["metadata"], message: "Missing metadata" });
  }

  return errors;
};
