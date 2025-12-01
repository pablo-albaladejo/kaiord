import { z } from "zod";

/**
 * Zod schema for equipment type enumeration.
 *
 * Defines swimming equipment types that can be specified for workout steps.
 *
 * @example
 * ```typescript
 * import { equipmentSchema } from '@kaiord/core';
 *
 * // Access enum values
 * const fins = equipmentSchema.enum.swim_fins;
 * const kickboard = equipmentSchema.enum.swim_kickboard;
 *
 * // Validate equipment
 * const result = equipmentSchema.safeParse('swim_fins');
 * if (result.success) {
 *   console.log('Valid equipment:', result.data);
 * }
 * ```
 */
export const equipmentSchema = z.enum([
  "none",
  "swim_fins",
  "swim_kickboard",
  "swim_paddles",
  "swim_pull_buoy",
  "swim_snorkel",
]);

/**
 * TypeScript type for equipment, inferred from {@link equipmentSchema}.
 *
 * String literal union of supported equipment types.
 */
export type Equipment = z.infer<typeof equipmentSchema>;
