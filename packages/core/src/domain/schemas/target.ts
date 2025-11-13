import { z } from "zod";
import {
  cadenceValueSchema,
  heartRateValueSchema,
  paceValueSchema,
  powerValueSchema,
  strokeTypeValueSchema,
} from "./target-values";

export const targetTypeEnum = z.enum([
  "power",
  "heart_rate",
  "cadence",
  "pace",
  "stroke_type",
  "open",
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
  z.object({
    type: z.literal(targetTypeEnum.enum.stroke_type),
    value: strokeTypeValueSchema,
  }),
  z.object({ type: z.literal(targetTypeEnum.enum.open) }),
]);

export type Target = z.infer<typeof targetSchema>;
export type TargetType = z.infer<typeof targetTypeEnum>;

export { targetUnitEnum } from "./target-values";
export type {
  CadenceValue,
  HeartRateValue,
  PaceValue,
  PowerValue,
  StrokeTypeValue,
  TargetUnit,
} from "./target-values";
