/** KRD Validator - Validates KRD structure with detailed error messages */

import type { KRD } from "@kaiord/core";

import { ValidationError } from "../types/errors";
import { type FieldError, fieldError } from "./krd-field-error";
import { validateMetadata, validateWorkout } from "./krd-validator-helpers";

export const validateKRD = (data: unknown): KRD => {
  const errors: Array<FieldError> = [];
  if (!data || typeof data !== "object") {
    throw new ValidationError("Invalid KRD: must be an object", [
      fieldError("root", "krd_expected_object"),
    ]);
  }
  const krd = data as Record<string, unknown>;
  if (!krd.version) errors.push(fieldError("version", "krd_required"));
  else if (typeof krd.version !== "string")
    errors.push(fieldError("version", "krd_invalid_value"));
  if (!krd.type) errors.push(fieldError("type", "krd_required"));
  else if (typeof krd.type !== "string")
    errors.push(fieldError("type", "krd_invalid_value"));
  else if (
    krd.type !== "structured_workout" &&
    krd.type !== "recorded_activity" &&
    krd.type !== "course"
  )
    errors.push(fieldError("type", "krd_invalid_value"));
  if (krd.metadata) {
    validateMetadata(krd.metadata, errors);
  } else {
    errors.push(fieldError("metadata", "krd_required"));
  }
  if (krd.type === "structured_workout") validateWorkout(krd, errors);
  if (errors.length > 0)
    throw new ValidationError("KRD validation failed", errors);
  return krd as KRD;
};
