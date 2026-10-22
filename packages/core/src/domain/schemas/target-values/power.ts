import { z } from "zod";

import {
  MIN_LTE_MAX_CODE,
  MIN_LTE_MAX_MESSAGE,
  minLteMax,
} from "./range-refinement";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for power target values.
 *
 * Validates power targets in watts, percent FTP, zones, or ranges.
 * Watts and range bounds are capped at 5000 W (above any recorded human
 * sprint peak); percent FTP is capped at 1000. Range targets enforce
 * `min <= max`. A range's bounds are watts unless `basis` is `"percent_ftp"`,
 * in which case they are percentages of FTP (e.g. a 50–75 % FTP ramp).
 *
 * @example
 * ```typescript
 * import { powerValueSchema } from '@kaiord/core';
 *
 * // Absolute watts
 * const watts = powerValueSchema.parse({ unit: 'watts', value: 250 });
 *
 * // Percent FTP
 * const ftp = powerValueSchema.parse({ unit: 'percent_ftp', value: 85 });
 *
 * // Power zone
 * const zone = powerValueSchema.parse({ unit: 'zone', value: 3 });
 *
 * // Range in percent FTP (absent basis = watts)
 * const ramp = powerValueSchema.parse({
 *   unit: 'range',
 *   min: 50,
 *   max: 75,
 *   basis: 'percent_ftp',
 * });
 * ```
 */
export const powerValueSchema = z.discriminatedUnion("unit", [
  z.object({
    unit: z.literal(targetUnitSchema.enum.watts),
    value: z.number().min(0).max(5000),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.percent_ftp),
    value: z.number().min(0).max(1000),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(7),
  }),
  z
    .object({
      unit: z.literal(targetUnitSchema.enum.range),
      min: z.number().min(0).max(5000),
      max: z.number().min(0).max(5000),
      basis: z.literal(targetUnitSchema.enum.percent_ftp).optional(),
    })
    .refine(minLteMax, {
      message: MIN_LTE_MAX_MESSAGE,
      path: ["min"],
      params: { code: MIN_LTE_MAX_CODE },
    }),
]);

/**
 * TypeScript type for power target value, inferred from {@link powerValueSchema}.
 *
 * Discriminated union representing power targets in various units.
 */
export type PowerValue = z.infer<typeof powerValueSchema>;
