import { z } from "zod";

/**
 * Zod schema for `extensions.health.weight` — a scalar weight measurement
 * captured at a point in time. Body-composition fields (fat percent, lean
 * mass, water, BMI) live in the separate `body_composition` payload so
 * scales that only report scalar weight produce a valid payload without
 * partial fields.
 */
export const weightMeasurementSchema = z.object({
  kind: z.literal("weight"),
  version: z.string().regex(/^2\.\d+$/),
  measuredAt: z.iso.datetime(),
  weightKilograms: z.number().positive(),
});

export type WeightMeasurement = z.infer<typeof weightMeasurementSchema>;
