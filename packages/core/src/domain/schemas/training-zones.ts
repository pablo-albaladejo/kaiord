import { z } from "zod";

/** A single band within a zone set (e.g. Coggan power zone 4). */
export const trainingZoneBandSchema = z.object({
  /** 1-based zone index within the set. */
  zone: z.number().int().positive(),
  /** Inclusive lower bound in the set's native unit. */
  min: z.number().nonnegative(),
  /** Inclusive upper bound; omitted for the open-ended top band. */
  max: z.number().nonnegative().optional(),
  label: z.string().optional(),
});

export type TrainingZoneBand = z.infer<typeof trainingZoneBandSchema>;

/** An ordered set of bands for one quantity (power / heart rate / pace). */
export const trainingZoneSetSchema = z.object({
  metric: z.enum(["power", "heart_rate", "pace"]),
  /** How the thresholds were derived (e.g. `"ftp"`, `"lthr"`). */
  method: z.string().optional(),
  bands: z.array(trainingZoneBandSchema),
});

export type TrainingZoneSet = z.infer<typeof trainingZoneSetSchema>;

/**
 * Zod schema for `training-zones` — a per-sport set of training zone
 * definitions imported from a coaching source. Snake_case per the domain
 * schema convention. Replaces the former `z.unknown()` passthrough so the
 * managed-data registry validates every type it routes.
 */
export const trainingZonesSchema = z.object({
  kind: z.literal("training_zones"),
  sport: z.string(),
  /** Reference threshold the bands anchor to (FTP watts, LTHR bpm, ...). */
  threshold: z.number().positive().optional(),
  sets: z.array(trainingZoneSetSchema),
});

export type TrainingZones = z.infer<typeof trainingZonesSchema>;
