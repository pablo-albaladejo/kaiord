import { z } from "zod";

export const krdMetadataSchema = z.object({
  created: z.string().datetime(),
  manufacturer: z.string().optional(),
  product: z.string().optional(),
  serialNumber: z.string().optional(),
  sport: z.string(),
  subSport: z.string().optional(),
});

export const krdSessionSchema = z.object({
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalTimerTime: z.number().min(0).optional(),
  totalDistance: z.number().min(0).optional(),
  sport: z.string(),
  subSport: z.string().optional(),
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  avgCadence: z.number().min(0).optional(),
  avgPower: z.number().min(0).optional(),
  totalCalories: z.number().int().min(0).optional(),
});

export const krdLapSchema = z.object({
  startTime: z.string().datetime(),
  totalElapsedTime: z.number().min(0),
  totalDistance: z.number().min(0).optional(),
  avgHeartRate: z.number().int().min(0).max(300).optional(),
  maxHeartRate: z.number().int().min(0).max(300).optional(),
  avgCadence: z.number().min(0).optional(),
  avgPower: z.number().min(0).optional(),
});

export const krdRecordSchema = z.object({
  timestamp: z.string().datetime(),
  position: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    })
    .optional(),
  altitude: z.number().optional(),
  heartRate: z.number().int().min(0).max(300).optional(),
  cadence: z.number().min(0).optional(),
  power: z.number().min(0).optional(),
  speed: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
});

export const krdEventSchema = z.object({
  timestamp: z.string().datetime(),
  eventType: z.enum([
    "start",
    "stop",
    "pause",
    "resume",
    "lap",
    "marker",
    "timer",
  ]),
  eventGroup: z.number().int().optional(),
  data: z.number().int().optional(),
});

export const krdSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/),
  type: z.enum(["workout", "activity", "course"]),
  metadata: krdMetadataSchema,
  sessions: z.array(krdSessionSchema).optional(),
  laps: z.array(krdLapSchema).optional(),
  records: z.array(krdRecordSchema).optional(),
  events: z.array(krdEventSchema).optional(),
  extensions: z.record(z.unknown()).optional(),
});

export type KRDMetadata = z.infer<typeof krdMetadataSchema>;
export type KRDSession = z.infer<typeof krdSessionSchema>;
export type KRDLap = z.infer<typeof krdLapSchema>;
export type KRDRecord = z.infer<typeof krdRecordSchema>;
export type KRDEvent = z.infer<typeof krdEventSchema>;
export type KRD = z.infer<typeof krdSchema>;
