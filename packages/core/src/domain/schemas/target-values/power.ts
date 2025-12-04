import { z } from "zod";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for power target values.
 *
 * Validates power targets in watts, percent FTP, zones, or ranges.
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
  z.object({ unit: z.literal(targetUnitSchema.enum.watts), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.percent_ftp),
    value: z.number(),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(7),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * TypeScript type for power target value, inferred from {@link powerValueSchema}.
 *
 * Discriminated union representing power targets in various units.
 */
export type PowerValue = z.infer<typeof powerValueSchema>;
