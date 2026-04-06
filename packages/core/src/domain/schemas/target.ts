import { z } from "zod";
import { targetTypeSchema } from "./target-type";
import {
  cadenceValueSchema,
  heartRateValueSchema,
  paceValueSchema,
  powerValueSchema,
  strokeTypeValueSchema,
} from "./target-values";

export { targetTypeSchema } from "./target-type";
export type { TargetType } from "./target-type";

/**
 * Zod schema for workout step target.
 *
 * Validates target specifications using discriminated unions based on target type.
 * Supports power, heart rate, cadence, pace, stroke type, and open targets.
 */
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

/**
 * TypeScript type for workout step target, inferred from {@link targetSchema}.
 *
 * Discriminated union type representing all possible target specifications.
 */
export type Target = z.infer<typeof targetSchema>;

export { targetUnitSchema } from "./target-values";
export type {
  CadenceValue,
  HeartRateValue,
  PaceValue,
  PowerValue,
  StrokeTypeValue,
  TargetUnit,
} from "./target-values";
