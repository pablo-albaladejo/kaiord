/**
 * Sport-Specific Zone Types and Schemas
 *
 * Types for per-sport training zone configurations.
 */

import { z } from "zod";

import type { HeartRateZone, PowerZone } from "./profile";

export const paceUnitSchema = z.enum(["min_per_km", "min_per_100m"]);

export type PaceUnit = z.infer<typeof paceUnitSchema>;

export const paceZoneSchema = z.object({
  zone: z.number().int().min(1).max(5),
  name: z.string().min(1).max(50),
  minPace: z.number().min(0),
  maxPace: z.number().min(0),
  unit: paceUnitSchema,
});

export type PaceZone = z.infer<typeof paceZoneSchema>;

export const sportThresholdsSchema = z.object({
  lthr: z.number().int().positive().max(250).optional(),
  ftp: z.number().int().positive().optional(),
  thresholdPace: z.number().positive().optional(),
  paceUnit: paceUnitSchema.optional(),
});

export type SportThresholds = z.infer<typeof sportThresholdsSchema>;

export const zoneModeSchema = z.enum(["auto", "manual"]);

export type ZoneMode = z.infer<typeof zoneModeSchema>;

export type ZoneConfig<T> = {
  method: string;
  zones: Array<T>;
};

export type SportZoneConfig = {
  thresholds: SportThresholds;
  heartRateZones: ZoneConfig<HeartRateZone>;
  powerZones?: ZoneConfig<PowerZone>;
  paceZones?: ZoneConfig<PaceZone>;
};

export type SportKey = "cycling" | "running" | "swimming" | "generic";

export const SPORT_ZONE_CAPABILITIES: Record<
  SportKey,
  { hr: boolean; power: boolean; pace: boolean }
> = {
  cycling: { hr: true, power: true, pace: false },
  running: { hr: true, power: true, pace: true },
  swimming: { hr: true, power: false, pace: true },
  generic: { hr: true, power: false, pace: false },
};
