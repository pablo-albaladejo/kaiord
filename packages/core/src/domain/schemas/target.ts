import { z } from "zod";

const powerValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("watts"), value: z.number() }),
  z.object({ unit: z.literal("percent_ftp"), value: z.number() }),
  z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(7) }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

const heartRateValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("bpm"), value: z.number() }),
  z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(5) }),
  z.object({ unit: z.literal("percent_max"), value: z.number() }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

const cadenceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("rpm"), value: z.number() }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

const paceValueSchema = z.discriminatedUnion("unit", [
  z.object({ unit: z.literal("mps"), value: z.number() }),
  z.object({ unit: z.literal("zone"), value: z.number().int().min(1).max(5) }),
  z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
]);

export const targetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("power"),
    value: powerValueSchema,
  }),
  z.object({
    type: z.literal("heart_rate"),
    value: heartRateValueSchema,
  }),
  z.object({
    type: z.literal("cadence"),
    value: cadenceValueSchema,
  }),
  z.object({
    type: z.literal("pace"),
    value: paceValueSchema,
  }),
  z.object({ type: z.literal("open") }),
]);

export type Target = z.infer<typeof targetSchema>;
export type PowerValue = z.infer<typeof powerValueSchema>;
export type HeartRateValue = z.infer<typeof heartRateValueSchema>;
export type CadenceValue = z.infer<typeof cadenceValueSchema>;
export type PaceValue = z.infer<typeof paceValueSchema>;
