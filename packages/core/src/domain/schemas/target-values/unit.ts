import { z } from "zod";

/**
 * Zod schema for target unit enumeration.
 *
 * Defines all possible units for target values (watts, zones, percentages, ranges, etc.).
 *
 * @example
 * ```typescript
 * import { targetUnitSchema } from '@kaiord/core';
 *
 * // Access enum values
 * const watts = targetUnitSchema.enum.watts;
 * const zone = targetUnitSchema.enum.zone;
 * ```
 */
export const targetUnitSchema = z.enum([
  "watts",
  "percent_ftp",
  "zone",
  "range",
  "bpm",
  "percent_max",
  "rpm",
  "mps",
  "swim_stroke",
]);

/**
 * TypeScript type for target unit, inferred from {@link targetUnitSchema}.
 *
 * String literal union of all possible target units.
 */
export type TargetUnit = z.infer<typeof targetUnitSchema>;
