import { z } from "zod";

/**
 * Zod schema for intensity level enumeration.
 *
 * Defines workout step intensity levels.
 *
 * @example
 * ```typescript
 * import { intensitySchema } from '@kaiord/core';
 *
 * // Access enum values
 * const warmup = intensitySchema.enum.warmup;
 * const active = intensitySchema.enum.active;
 *
 * // Validate intensity
 * const result = intensitySchema.safeParse('warmup');
 * if (result.success) {
 *   console.log('Valid intensity:', result.data);
 * }
 * ```
 */
export const intensitySchema = z.enum([
  "warmup",
  "active",
  "cooldown",
  "rest",
  "recovery",
  "interval",
  "other",
]);

/**
 * TypeScript type for intensity level, inferred from {@link intensitySchema}.
 *
 * String literal union of supported intensity levels.
 */
export type Intensity = z.infer<typeof intensitySchema>;
