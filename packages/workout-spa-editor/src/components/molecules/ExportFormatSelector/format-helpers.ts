import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

const WARNED_FORMATS: ReadonlySet<WorkoutFileFormat> = new Set([
  "fit",
  "tcx",
  "zwo",
  "gcn",
]);

/**
 * Gets the format-specific warning for a workout, in the active locale
 */
export const getFormatWarnings = (
  format: WorkoutFileFormat,
  workout?: KRD,
  t: Translate = getTranslate("editor")
): string | null => {
  if (!workout || !WARNED_FORMATS.has(format)) return null;
  return t(`exportFormat.warnings.${format}`);
};

/**
 * Validates workout before export
 */
export const validateWorkoutForExport = (
  workout?: KRD,
  t: Translate = getTranslate("editor")
): ValidationError[] => {
  if (!workout) {
    return [
      { path: ["workout"], message: t("exportFormat.invalid.noWorkout") },
    ];
  }

  const errors: ValidationError[] = [];

  if (!workout.version) {
    errors.push({
      path: ["version"],
      message: t("exportFormat.invalid.version"),
    });
  }

  if (!workout.type) {
    errors.push({ path: ["type"], message: t("exportFormat.invalid.type") });
  }

  if (!workout.metadata) {
    errors.push({
      path: ["metadata"],
      message: t("exportFormat.invalid.metadata"),
    });
  }

  return errors;
};
