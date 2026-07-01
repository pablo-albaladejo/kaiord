import { z } from "zod";

import { targetUnitSchema } from "./unit";

type Range = { min: number; max: number };

const minLteMax = (range: Range): boolean => range.min <= range.max;

const MIN_LTE_MAX_MESSAGE = "min must be less than or equal to max";

/**
 * Builds the `range` member shared by every target-value discriminated
 * union: a `{ min, max }` pair capped at `bound`, refined so inverted
 * ranges (e.g. `{ min: 200, max: 150 }`) fail schema validation instead of
 * silently corrupting round-trip conversions.
 */
export const rangeMember = (bound: number) =>
  z
    .object({
      unit: z.literal(targetUnitSchema.enum.range),
      min: z.number().min(0).max(bound),
      max: z.number().min(0).max(bound),
    })
    .refine(minLteMax, { message: MIN_LTE_MAX_MESSAGE, path: ["min"] });
