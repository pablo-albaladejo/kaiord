import { z } from "zod";

import { healthVersionSchema } from "./version";

/**
 * Zod schema for `extensions.health.weight` — a scalar weight measurement
 * captured at a point in time. Body-composition fields (fat percent, lean
 * mass, water, BMI) live in the separate `body_composition` payload so
 * scales that only report scalar weight produce a valid payload without
 * partial fields.
 */
export const weightMeasurementSchema = z.object({
  kind: z.literal("weight"),
  version: healthVersionSchema,
  measuredAt: z.iso.datetime(),
  weightKilograms: z.number().positive(),
  kaiordRecordId: z.string().uuid().optional(),
  sourceBridgeId: z.string().optional(),
  externalId: z.string().optional(),
});

export type WeightMeasurement = z.infer<typeof weightMeasurementSchema>;
