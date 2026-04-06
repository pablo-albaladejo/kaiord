/**
 * Sport Zone Zod Schemas
 *
 * Zod schemas for runtime validation of sport zone structures.
 */

import { z } from "zod";

import { paceZoneSchema, sportThresholdsSchema } from "./sport-zones";
import { heartRateZoneSchema, powerZoneSchema } from "./zone-schemas";

const zoneConfigSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({ method: z.string(), zones: z.array(itemSchema) });

export const sportZoneConfigSchema = z.object({
  thresholds: sportThresholdsSchema,
  heartRateZones: zoneConfigSchema(heartRateZoneSchema),
  powerZones: zoneConfigSchema(powerZoneSchema).optional(),
  paceZones: zoneConfigSchema(paceZoneSchema).optional(),
});

export const sportZonesRecordSchema = z.object({
  cycling: sportZoneConfigSchema.optional(),
  running: sportZoneConfigSchema.optional(),
  swimming: sportZoneConfigSchema.optional(),
  generic: sportZoneConfigSchema.optional(),
});
