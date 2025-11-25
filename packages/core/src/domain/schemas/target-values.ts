import { z } from "zod";

/**
 * Zod schema for target unit enumeration.
 *
 * Defines all possible units for target values (watts, zones, percentages, ranges, etc.).
 *
 * @example
 * ```typescript
 * import { targetUnitSchema } from '@kaiord/core';
 *
 * // Access enum values
 * const watts = targetUnitSchema.enum.watts;
 * const zone = targetUnitSchema.enum.zone;
 * ```
 */
export const targetUnitSchema = z.enum([
  "watts",
  "percent_ftp",
  "zone",
  "range",
  "bpm",
  "percent_max",
  "rpm",
  "mps",
  "swim_stroke",
]);

/**
 * Zod schema for power target values.
 *
 * Validates power targets in watts, percent FTP, zones, or ranges.
 *
 * @example
 * ```typescript
 * import { powerValueSchema } from '@kaiord/core';
 *
 * // Absolute watts
 * const watts = powerValueSchema.parse({ unit: 'watts', value: 250 });
 *
 * // Percent FTP
 * const ftp = powerValueSchema.parse({ unit: 'percent_ftp', value: 85 });
 *
 * // Power zone
 * const zone = powerValueSchema.parse({ unit: 'zone', value: 3 });
 * ```
 */
export const powerValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitSchema.enum.watts), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.percent_ftp),
    value: z.number(),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(7),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * Zod schema for heart rate target values.
 *
 * Validates heart rate targets in BPM, zones, percent max, or ranges.
 *
 * @example
 * ```typescript
 * import { heartRateValueSchema } from '@kaiord/core';
 *
 * // Absolute BPM
 * const bpm = heartRateValueSchema.parse({ unit: 'bpm', value: 145 });
 *
 * // Heart rate zone
 * const zone = heartRateValueSchema.parse({ unit: 'zone', value: 2 });
 * ```
 */
export const heartRateValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitSchema.enum.bpm), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.percent_max),
    value: z.number(),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * Zod schema for cadence target values.
 *
 * Validates cadence targets in RPM or ranges.
 *
 * @example
 * ```typescript
 * import { cadenceValueSchema } from '@kaiord/core';
 *
 * // Absolute RPM
 * const rpm = cadenceValueSchema.parse({ unit: 'rpm', value: 90 });
 *
 * // Cadence range
 * const range = cadenceValueSchema.parse({ unit: 'range', min: 85, max: 95 });
 * ```
 */
export const cadenceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitSchema.enum.rpm), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * Zod schema for pace target values.
 *
 * Validates pace targets in meters per second, zones, or ranges.
 *
 * @example
 * ```typescript
 * import { paceValueSchema } from '@kaiord/core';
 *
 * // Absolute pace (m/s)
 * const mps = paceValueSchema.parse({ unit: 'mps', value: 3.5 });
 *
 * // Pace zone
 * const zone = paceValueSchema.parse({ unit: 'zone', value: 2 });
 * ```
 */
export const paceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitSchema.enum.mps), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

/**
 * Zod schema for stroke type target values.
 *
 * Validates swimming stroke type targets.
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
 * TypeScript type for target unit, inferred from {@link targetUnitSchema}.
 *
 * String literal union of all possible target units.
 */
export type TargetUnit = z.infer<typeof targetUnitSchema>;

/**
 * TypeScript type for power target value, inferred from {@link powerValueSchema}.
 *
 * Discriminated union representing power targets in various units.
 */
export type PowerValue = z.infer<typeof powerValueSchema>;

/**
 * TypeScript type for heart rate target value, inferred from {@link heartRateValueSchema}.
 *
 * Discriminated union representing heart rate targets in various units.
 */
export type HeartRateValue = z.infer<typeof heartRateValueSchema>;

/**
 * TypeScript type for cadence target value, inferred from {@link cadenceValueSchema}.
 *
 * Discriminated union representing cadence targets in various units.
 */
export type CadenceValue = z.infer<typeof cadenceValueSchema>;

/**
 * TypeScript type for pace target value, inferred from {@link paceValueSchema}.
 *
 * Discriminated union representing pace targets in various units.
 */
export type PaceValue = z.infer<typeof paceValueSchema>;

/**
 * TypeScript type for stroke type target value, inferred from {@link strokeTypeValueSchema}.
 *
 * Represents swimming stroke type targets.
 */
export type StrokeTypeValue = z.infer<typeof strokeTypeValueSchema>;
