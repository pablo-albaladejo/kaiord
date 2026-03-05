/**
 * AI-compatible workout schema for structured output.
 *
 * Mirrors workoutSchema from @kaiord/core but replaces .positive()
 * with .min(1) to avoid exclusiveMinimum in JSON Schema, which
 * Anthropic's structured output does not support.
 *
 * The output is validated again with the strict workoutSchema after
 * the LLM generates it.
 */

import { z } from "zod";

const pos = () => z.number().min(0);
const posInt = () => z.number().int().min(0);

const sportSchema = z.enum(["cycling", "running", "swimming", "generic"]);

const intensitySchema = z.enum([
  "warmup",
  "active",
  "interval",
  "recovery",
  "rest",
  "cooldown",
]);

const durationSchema = z.union([
  z.object({ type: z.literal("time"), seconds: pos() }),
  z.object({ type: z.literal("distance"), meters: pos() }),
  z.object({ type: z.literal("open") }),
  z.object({ type: z.literal("calories"), calories: posInt() }),
  z.object({ type: z.literal("hr_above"), bpm: posInt() }),
  z.object({ type: z.literal("hr_below"), bpm: posInt() }),
  z.object({ type: z.literal("calories_above"), calories: posInt() }),
  z.object({ type: z.literal("power_above"), watts: pos() }),
  z.object({ type: z.literal("power_below"), watts: pos() }),
  z.object({ type: z.literal("repeat_until_time"), seconds: pos() }),
  z.object({ type: z.literal("repeat_until_distance"), meters: pos() }),
  z.object({ type: z.literal("repeat_until_calories"), calories: posInt() }),
  z.object({ type: z.literal("repeat_until_hr_above"), bpm: posInt() }),
  z.object({ type: z.literal("repeat_until_power_above"), watts: pos() }),
  z.object({ type: z.literal("repeat_until_power_below"), watts: pos() }),
  z.object({ type: z.literal("lap_button") }),
]);

const targetSchema = z.union([
  z.object({
    type: z.literal("power"),
    value: z.union([
      z.object({ unit: z.literal("watts"), value: z.number() }),
      z.object({ unit: z.literal("percent_ftp"), value: z.number() }),
      z.object({ unit: z.literal("zone"), value: z.number().int() }),
      z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
    ]),
  }),
  z.object({
    type: z.literal("heart_rate"),
    value: z.union([
      z.object({ unit: z.literal("bpm"), value: z.number() }),
      z.object({ unit: z.literal("percent_max"), value: z.number() }),
      z.object({ unit: z.literal("zone"), value: z.number().int() }),
      z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
    ]),
  }),
  z.object({
    type: z.literal("cadence"),
    value: z.union([
      z.object({ unit: z.literal("rpm"), value: z.number() }),
      z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
    ]),
  }),
  z.object({
    type: z.literal("pace"),
    value: z.union([
      z.object({ unit: z.literal("mps"), value: z.number() }),
      z.object({ unit: z.literal("zone"), value: z.number().int() }),
      z.object({ unit: z.literal("range"), min: z.number(), max: z.number() }),
    ]),
  }),
  z.object({ type: z.literal("stroke_type"), value: z.string() }),
  z.object({ type: z.literal("open") }),
]);

const stepSchema = z.object({
  stepIndex: z.number().int().min(0),
  name: z.string().optional(),
  durationType: z.string(),
  duration: durationSchema,
  targetType: z.string(),
  target: targetSchema,
  intensity: intensitySchema.optional(),
  notes: z.string().optional(),
  equipment: z.string().optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

const blockSchema = z.object({
  id: z.string().optional(),
  repeatCount: z.number().int().min(1),
  steps: z.array(stepSchema),
});

export const aiWorkoutSchema = z.object({
  name: z.string().optional(),
  sport: sportSchema,
  subSport: z.string().optional(),
  poolLength: z.number().optional(),
  poolLengthUnit: z.literal("meters").optional(),
  steps: z.array(z.union([stepSchema, blockSchema])),
  extensions: z.record(z.string(), z.unknown()).optional(),
});
