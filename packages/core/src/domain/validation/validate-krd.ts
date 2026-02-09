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
    throw createKrdValidationError(
      `KRD validation failed: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")}`,
      result.error.issues.map((i) => ({
        field: i.path.join(".") || "root",
        message: i.message,
      }))
    );
  }

  return result.data;
};
