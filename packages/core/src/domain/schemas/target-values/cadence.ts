import { z } from "zod";

import {
  MIN_LTE_MAX_CODE,
  MIN_LTE_MAX_MESSAGE,
  minLteMax,
} from "./range-refinement";
import { targetUnitSchema } from "./unit";

/**
 * Zod schema for cadence target values.
 *
 * Validates cadence targets in RPM or ranges. Values are capped at
 * 300 rpm (above running step-rate targets, which are expressed in
 * steps per minute). Range targets enforce `min <= max`.
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
  z.object({
    unit: z.literal(targetUnitSchema.enum.rpm),
    value: z.number().min(0).max(300),
  }),
  z
    .object({
      unit: z.literal(targetUnitSchema.enum.range),
      min: z.number().min(0).max(300),
      max: z.number().min(0).max(300),
    })
    .refine(minLteMax, {
      message: MIN_LTE_MAX_MESSAGE,
      path: ["min"],
      params: { code: MIN_LTE_MAX_CODE },
    }),
]);

/**
 * TypeScript type for cadence target value, inferred from {@link cadenceValueSchema}.
 *
 * Discriminated union representing cadence targets in various units.
 */
export type CadenceValue = z.infer<typeof cadenceValueSchema>;
