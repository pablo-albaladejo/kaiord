/** KRD Validator - Validates KRD structure with detailed error messages */

import type { KRD } from "@kaiord/core";
import { ValidationError } from "../types/errors";
import { validateMetadata, validateWorkout } from "./krd-validator-helpers";

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
    errors.push({ field: "version", message: "Required field missing" });
  else if (typeof krd.version !== "string")
    errors.push({ field: "version", message: "Must be a string" });
  if (!krd.type)
    errors.push({ field: "type", message: "Required field missing" });
  else if (typeof krd.type !== "string")
    errors.push({ field: "type", message: "Must be a string" });
  else if (krd.type !== "workout" && krd.type !== "activity")
    errors.push({ field: "type", message: 'Must be "workout" or "activity"' });
  if (!krd.metadata)
    errors.push({ field: "metadata", message: "Required field missing" });
  else validateMetadata(krd.metadata, errors);
  if (krd.type === "workout") validateWorkout(krd, errors);
  if (errors.length > 0)
    throw new ValidationError("KRD validation failed", errors);
  return krd as KRD;
};
