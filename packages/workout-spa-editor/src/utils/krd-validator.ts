/** KRD Validator - Validates KRD structure with detailed error messages */

import { validateMetadata, validateWorkout } from "./krd-validator-helpers";
import { ValidationError } from "../types/errors";
import type { KRD } from "@kaiord/core";

type FieldError = { field: string; message: string };

export const validateKRD = (data: unknown): KRD => {
  const errors: Array<FieldError> = [];
  if (!data || typeof data !== "object") {
    throw new ValidationError("Invalid KRD: must be an object", [
      { field: "root", message: "Expected an object" },
    ]);
  }
  const krd = data as Record<string, unknown>;
  if (!krd.version)
    errors.push({ field: "version", message: "Missing required field" });
  else if (typeof krd.version !== "string")
    errors.push({ field: "version", message: "Invalid value" });
  if (!krd.type)
    errors.push({ field: "type", message: "Missing required field" });
  else if (typeof krd.type !== "string")
    errors.push({ field: "type", message: "Invalid value" });
  else if (krd.type !== "workout" && krd.type !== "activity")
    errors.push({ field: "type", message: "Invalid value" });
  if (krd.metadata) {
    validateMetadata(krd.metadata, errors);
  } else {
    errors.push({ field: "metadata", message: "Missing required field" });
  }
  if (krd.type === "workout") validateWorkout(krd, errors);
  if (errors.length > 0)
    throw new ValidationError("KRD validation failed", errors);
  return krd as KRD;
};
