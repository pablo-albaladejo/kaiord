/**
 * Sport Zone Zod Schemas
 *
 * Zod schemas for runtime validation of sport zone structures.
 */

import { z } from "zod";
import { heartRateZoneSchema, powerZoneSchema } from "./profile";
import {
  paceZoneSchema,
  sportThresholdsSchema,
  zoneModeSchema,
} from "./sport-zones";

const zoneConfigSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({ mode: zoneModeSchema, zones: z.array(itemSchema) });

export const sportZoneConfigSchema = z.object({
  thresholds: sportThresholdsSchema,
  heartRateZones: zoneConfigSchema(heartRateZoneSchema),
  powerZones: zoneConfigSchema(powerZoneSchema).optional(),
  paceZones: zoneConfigSchema(paceZoneSchema).optional(),
});

const sportKeySchema = z.enum(["cycling", "running", "swimming", "generic"]);

export const sportZonesRecordSchema = z
  .record(sportKeySchema, sportZoneConfigSchema)
  .optional();
