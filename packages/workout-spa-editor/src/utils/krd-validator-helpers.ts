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
      message: "Missing required field",
    });
  else if (typeof meta.created !== "string")
    errors.push({ field: "metadata.created", message: "Invalid value" });
  if (!meta.sport)
    errors.push({ field: "metadata.sport", message: "Missing required field" });
  else if (typeof meta.sport !== "string")
    errors.push({ field: "metadata.sport", message: "Invalid value" });
};

export const validateWorkout = (
  krd: Record<string, unknown>,
  errors: Array<FieldError>
): void => {
  if (!krd.extensions) {
    errors.push({
      field: "extensions",
      message: "Missing required field for workout type",
    });
    return;
  }
  if (typeof krd.extensions !== "object" || krd.extensions === null) {
    errors.push({ field: "extensions", message: "Must be an object" });
    return;
  }
  const extensions = krd.extensions as Record<string, unknown>;
  if (!extensions.structured_workout) {
    errors.push({
      field: "extensions.structured_workout",
      message: "Missing required field for workout type",
    });
    return;
  }
  if (
    typeof extensions.structured_workout !== "object" ||
    extensions.structured_workout === null
  ) {
    errors.push({
      field: "extensions.structured_workout",
      message: "Must be an object",
    });
    return;
  }
  const workout = extensions.structured_workout as Record<string, unknown>;
  if (!workout.sport)
    errors.push({
      field: "extensions.structured_workout.sport",
      message: "Missing required field",
    });
  if (!Array.isArray(workout.steps))
    errors.push({
      field: "extensions.structured_workout.steps",
      message: "Must be an array",
    });
};
