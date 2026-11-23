/** KRD Validator Helper Functions */

import { type FieldError, fieldError } from "./krd-field-error";

export const validateMetadata = (
  metadata: unknown,
  errors: Array<FieldError>
): void => {
  if (!metadata || typeof metadata !== "object" || metadata === null) {
    errors.push(fieldError("metadata", "krd_not_object"));
    return;
  }
  const meta = metadata as Record<string, unknown>;
  if (!meta.created)
    errors.push(fieldError("metadata.created", "krd_required"));
  else if (typeof meta.created !== "string")
    errors.push(fieldError("metadata.created", "krd_invalid_value"));
  if (!meta.sport) errors.push(fieldError("metadata.sport", "krd_required"));
  else if (typeof meta.sport !== "string")
    errors.push(fieldError("metadata.sport", "krd_invalid_value"));
};

export const validateWorkout = (
  krd: Record<string, unknown>,
  errors: Array<FieldError>
): void => {
  if (!krd.extensions) {
    errors.push(fieldError("extensions", "krd_required_for_workout"));
    return;
  }
  if (typeof krd.extensions !== "object" || krd.extensions === null) {
    errors.push(fieldError("extensions", "krd_not_object"));
    return;
  }
  const extensions = krd.extensions as Record<string, unknown>;
  if (!extensions.structured_workout) {
    errors.push(
      fieldError("extensions.structured_workout", "krd_required_for_workout")
    );
    return;
  }
  if (
    typeof extensions.structured_workout !== "object" ||
    extensions.structured_workout === null
  ) {
    errors.push(fieldError("extensions.structured_workout", "krd_not_object"));
    return;
  }
  const workout = extensions.structured_workout as Record<string, unknown>;
  if (!workout.sport)
    errors.push(
      fieldError("extensions.structured_workout.sport", "krd_required")
    );
  if (!Array.isArray(workout.steps))
    errors.push(
      fieldError("extensions.structured_workout.steps", "krd_not_array")
    );
};
