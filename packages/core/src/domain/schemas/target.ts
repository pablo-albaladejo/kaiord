import { z } from "zod";

export const targetTypeEnum = z.enum([
  "power",
  "heart_rate",
  "cadence",
  "pace",
  "open",
]);
export const targetUnitEnum = z.enum([
  "watts",
  "percent_ftp",
  "zone",
  "range",
  "bpm",
  "percent_max",
  "rpm",
  "mps",
]);

const powerValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitEnum.enum.watts), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.percent_ftp),
    value: z.number(),
  }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.zone),
    value: z.number().int().min(1).max(7),
  }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

const heartRateValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitEnum.enum.bpm), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.percent_max),
    value: z.number(),
  }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

const cadenceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitEnum.enum.rpm), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

const paceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal(targetUnitEnum.enum.mps), value: z.number() }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.zone),
    value: z.number().int().min(1).max(5),
  }),
  z.object({
    unit: z.literal(targetUnitEnum.enum.range),
    min: z.number(),
    max: z.number(),
  }),
]);

export const targetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(targetTypeEnum.enum.power),
    value: powerValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeEnum.enum.heart_rate),
    value: heartRateValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeEnum.enum.cadence),
    value: cadenceValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeEnum.enum.pace),
    value: paceValueSchema,
  }),
  z.object({ type: z.literal(targetTypeEnum.enum.open) }),
]);

export type Target = z.infer<typeof targetSchema>;
export type TargetType = z.infer<typeof targetTypeEnum>;
export type TargetUnit = z.infer<typeof targetUnitEnum>;
export type PowerValue = z.infer<typeof powerValueSchema>;
export type HeartRateValue = z.infer<typeof heartRateValueSchema>;
export type CadenceValue = z.infer<typeof cadenceValueSchema>;
export type PaceValue = z.infer<typeof paceValueSchema>;
