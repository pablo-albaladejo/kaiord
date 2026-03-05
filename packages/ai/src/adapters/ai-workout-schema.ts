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
 */

import { z } from "zod";

const durationSchema = z.object({
  type: z.string(),
  seconds: z.number().optional(),
  meters: z.number().optional(),
  calories: z.number().optional(),
});

const targetValueSchema = z.object({
  unit: z.string(),
  value: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
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
  repeatCount: z.number(),
  steps: z.array(stepSchema),
});

export const aiWorkoutSchema = z.object({
  sport: z.enum(["cycling", "running", "swimming", "generic"]),
  steps: z.array(z.union([stepSchema, blockSchema])),
});
