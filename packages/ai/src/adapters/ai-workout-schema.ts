/**
 * Simplified AI-compatible workout schema for structured output.
 *
 * Uses permissive types (no deep unions) to stay within Anthropic's
 * structured output schema complexity limits. The LLM output is then
 * validated against the strict workoutSchema from @kaiord/core.
 *
 * Key simplifications:
 * - duration/target use a flat object with optional fields instead of
 *   deeply nested anyOf/union discriminated types
 * - No extensions (the LLM doesn't need to generate them)
 * - The system prompt describes the exact shape the LLM should produce
 *
 * The model copies the coach's numbers in the coach's units (time and
 * distance parts, a pace clock per a distance, a split, a speed, a reference,
 * a block's total time); `resolveCoachLiterals` computes the rest.
 */

import { z } from "zod";

const durationSchema = z.object({
  type: z.string(),
  hours: z.number().optional(),
  minutes: z.number().optional(),
  seconds: z.number().optional(),
  meters: z.number().optional(),
  kilometers: z.number().optional(),
  miles: z.number().optional(),
  calories: z.number().optional(),
});

const targetValueSchema = z.object({
  unit: z.string(),
  value: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  // Without it zod strips the field and a % FTP range reads back as watts.
  basis: z.literal("percent_ftp").optional(),
  per: z.string().optional(),
  clock: z.string().optional(),
  clockTo: z.string().optional(),
  reference: z.string().optional(),
});

const targetSchema = z.object({
  type: z.string(),
  value: targetValueSchema.optional(),
});

const stepSchema = z.object({
  stepIndex: z.number(),
  durationType: z.string(),
  duration: durationSchema,
  targetType: z.string(),
  target: targetSchema,
  intensity: z.string(),
});

const blockSchema = z.object({
  repeatCount: z.number().optional(),
  fill: durationSchema.optional(),
  steps: z.array(stepSchema),
});

export const aiWorkoutSchema = z.object({
  name: z.string().optional(),
  sport: z.enum(["cycling", "running", "swimming", "generic"]),
  steps: z.array(z.union([stepSchema, blockSchema])),
});
