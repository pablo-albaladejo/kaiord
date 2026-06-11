import { z } from "zod";

import { targetUnitSchema } from "./unit";

/**
 * Zod schema for stroke type target values.
 *
 * Validates swimming stroke type targets. `value` is the FIT protocol
 * swim-stroke code (0-5, see `SWIM_STROKE_TO_FIT`), NOT an index into
 * the seven-variant `swimStrokeSchema` enum — `im` and `mixed` both map
 * to FIT code 5, so `max(5)` is correct.
 *
 * @example
 * ```typescript
 * import { strokeTypeValueSchema } from '@kaiord/core';
 *
 * const stroke = strokeTypeValueSchema.parse({
 *   unit: 'swim_stroke',
 *   value: 0 // freestyle
 * });
 * ```
 */
export const strokeTypeValueSchema = z.object({
  unit: z.literal(targetUnitSchema.enum.swim_stroke),
  value: z.number().int().min(0).max(5),
});

/**
 * TypeScript type for stroke type target value, inferred from {@link strokeTypeValueSchema}.
 *
 * Represents swimming stroke type targets.
 */
export type StrokeTypeValue = z.infer<typeof strokeTypeValueSchema>;
