import { mapZodErrors } from "./map-zod-errors";
import { krdSchema } from "../schemas/krd";
import { createKrdValidationError } from "../types/errors";
import type { KRD } from "../schemas/krd";

/**
 * Validates unknown data against the KRD schema.
 *
 * @param krd - Data to validate
 * @returns Validated and parsed KRD object (via Zod's result.data)
 * @throws {KrdValidationError} When validation fails
 */
export const validateKrd = (krd: unknown): KRD => {
  const result = krdSchema.safeParse(krd);

  if (!result.success) {
    const errors = mapZodErrors(result.error.issues);
    throw createKrdValidationError(
      `KRD validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
      errors
    );
  }

  return result.data;
};
