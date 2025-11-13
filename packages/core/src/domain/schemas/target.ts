import { z } from "zod";
import {
  cadenceValueSchema,
  heartRateValueSchema,
  paceValueSchema,
  powerValueSchema,
  strokeTypeValueSchema,
} from "./target-values";

export const targetTypeSchema = z.enum([
  "power",
  "heart_rate",
  "cadence",
  "pace",
  "stroke_type",
  "open",
]);

export const targetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(targetTypeSchema.enum.power),
    value: powerValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.heart_rate),
    value: heartRateValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.cadence),
    value: cadenceValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.pace),
    value: paceValueSchema,
  }),
  z.object({
    type: z.literal(targetTypeSchema.enum.stroke_type),
    value: strokeTypeValueSchema,
  }),
  z.object({ type: z.literal(targetTypeSchema.enum.open) }),
]);

export type Target = z.infer<typeof targetSchema>;
export type TargetType = z.infer<typeof targetTypeSchema>;

export { targetUnitSchema } from "./target-values";
export type {
  CadenceValue,
  HeartRateValue,
  PaceValue,
  PowerValue,
  StrokeTypeValue,
  TargetUnit,
} from "./target-values";
