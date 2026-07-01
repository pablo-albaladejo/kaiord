import { z } from "zod";

import { rangeMember } from "./range-refinement";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for power target values.
 *
 * Validates power targets in watts, percent FTP, zones, or ranges.
 * Watts and range bounds are capped at 5000 W (above any recorded human
 * sprint peak); percent FTP is capped at 1000. Range targets enforce
 * `min <= max`.
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
  rangeMember(5000),
]);

/**
 * TypeScript type for power target value, inferred from {@link powerValueSchema}.
 *
 * Discriminated union representing power targets in various units.
 */
export type PowerValue = z.infer<typeof powerValueSchema>;
