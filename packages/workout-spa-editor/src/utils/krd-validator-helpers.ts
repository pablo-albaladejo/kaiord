/** KRD Validator Helper Functions */

type FieldError = { field: string; message: string };

export const validateMetadata = (
  metadata: unknown,
  errors: Array<FieldError>
): void => {
  if (!metadata || typeof metadata !== "object" || metadata === null) {
    errors.push({ field: "metadata", message: "Must be an object" });
    return;
  }
  const meta = metadata as Record<string, unknown>;
  if (!meta.created)
    errors.push({
      field: "metadata.created",
      message: "Required field missing",
    });
  else if (typeof meta.created !== "string")
    errors.push({ field: "metadata.created", message: "Must be a string" });
  if (!meta.sport)
    errors.push({ field: "metadata.sport", message: "Required field missing" });
  else if (typeof meta.sport !== "string")
    errors.push({ field: "metadata.sport", message: "Must be a string" });
};

export const validateWorkout = (
  krd: Record<string, unknown>,
  errors: Array<FieldError>
): void => {
  if (!krd.extensions) {
    errors.push({
      field: "extensions",
      message: "Required field missing for workout type",
    });
    return;
  }
  if (typeof krd.extensions !== "object" || krd.extensions === null) {
    errors.push({ field: "extensions", message: "Must be an object" });
    return;
  }
  const extensions = krd.extensions as Record<string, unknown>;
  if (!extensions.workout) {
    errors.push({
      field: "extensions.workout",
      message: "Required field missing for workout type",
    });
    return;
  }
  if (typeof extensions.workout !== "object" || extensions.workout === null) {
    errors.push({ field: "extensions.workout", message: "Must be an object" });
    return;
  }
  const workout = extensions.workout as Record<string, unknown>;
  if (!workout.sport)
    errors.push({
      field: "extensions.workout.sport",
      message: "Required field missing",
    });
  if (!Array.isArray(workout.steps))
    errors.push({
      field: "extensions.workout.steps",
      message: "Must be an array",
    });
};
