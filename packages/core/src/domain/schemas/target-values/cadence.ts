import { z } from "zod";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for cadence target values.
 *
 * Validates cadence targets in RPM or ranges.
 *
 * @example
 * ```typescript
 * import { cadenceValueSchema } from '@kaiord/core';
 *
 * // Absolute RPM
 * const rpm = cadenceValueSchema.parse({ unit: 'rpm', value: 90 });
 *
 * // Cadence range
 * const range = cadenceValueSchema.parse({ unit: 'range', min: 85, max: 95 });
 * ```
 */
export const cadenceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitSchema.enum.rpm), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * TypeScript type for cadence target value, inferred from {@link cadenceValueSchema}.
 *
 * Discriminated union representing cadence targets in various units.
 */
export type CadenceValue = z.infer<typeof cadenceValueSchema>;
