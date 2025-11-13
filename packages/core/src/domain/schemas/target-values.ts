import { z } from "zod";

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

export const cadenceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitSchema.enum.rpm), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitSchema.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

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

export const strokeTypeValueSchema = z.object({
  unit: z.literal(targetUnitSchema.enum.swim_stroke),
  value: z.number().int().min(0).max(5),
});

export type TargetUnit = z.infer<typeof targetUnitSchema>;
export type PowerValue = z.infer<typeof powerValueSchema>;
export type HeartRateValue = z.infer<typeof heartRateValueSchema>;
export type CadenceValue = z.infer<typeof cadenceValueSchema>;
export type PaceValue = z.infer<typeof paceValueSchema>;
export type StrokeTypeValue = z.infer<typeof strokeTypeValueSchema>;
