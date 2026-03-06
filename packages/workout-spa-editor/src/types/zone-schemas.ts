/**
 * Base Zone Schemas
 *
 * Shared Zod schemas for power and heart rate zones.
 * Extracted to avoid circular imports between profile.ts and sport-zones-schemas.ts.
 */

import { z } from "zod";

export const powerZoneSchema = z.object({
  zone: z.number().int().min(1).max(7),
  name: z.string().min(1).max(50),
  minPercent: z.number().min(0).max(200),
  maxPercent: z.number().min(0).max(200),
});

export type PowerZone = z.infer<typeof powerZoneSchema>;

export const heartRateZoneSchema = z.object({
  zone: z.number().int().min(1).max(5),
  name: z.string().min(1).max(50),
  minBpm: z.number().int().min(0).max(250),
  maxBpm: z.number().int().min(0).max(250),
});

export type HeartRateZone = z.infer<typeof heartRateZoneSchema>;
