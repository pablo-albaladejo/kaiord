import { z } from "zod";

/**
 * Zod schema for sport type enumeration.
 *
 * Defines primary sport types supported by KRD format.
 *
 * @example
 * ```typescript
 * import { sportSchema } from '@kaiord/core';
 *
 * // Access enum values
 * const cycling = sportSchema.enum.cycling;
 * const running = sportSchema.enum.running;
 *
 * // Validate sport
 * const result = sportSchema.safeParse('running');
 * if (result.success) {
 *   console.log('Valid sport:', result.data);
 * }
 * ```
 */
export const sportSchema = z.enum([
  "cycling",
  "running",
  "swimming",
  "generic",
]);

/**
 * TypeScript type for sport, inferred from {@link sportSchema}.
 *
 * String literal union of supported sport types.
 */
export type Sport = z.infer<typeof sportSchema>;
