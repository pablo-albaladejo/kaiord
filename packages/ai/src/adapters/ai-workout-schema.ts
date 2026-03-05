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

const stepSchema = z.object({
  stepIndex: z.number(),
  name: z.string().optional(),
  durationType: z.string(),
  duration: z.object({
    type: z.string(),
    seconds: z.number().optional(),
    meters: z.number().optional(),
    calories: z.number().optional(),
    bpm: z.number().optional(),
    watts: z.number().optional(),
  }),
  targetType: z.string(),
  target: z.object({
    type: z.string(),
    value: z
      .object({
        unit: z.string().optional(),
        value: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
  }),
  intensity: z.string().optional(),
  notes: z.string().optional(),
});

const blockSchema = z.object({
  repeatCount: z.number(),
  steps: z.array(stepSchema),
});

export const aiWorkoutSchema = z.object({
  name: z.string().optional(),
  sport: z.enum(["cycling", "running", "swimming", "generic"]),
  subSport: z.string().optional(),
  steps: z.array(z.union([stepSchema, blockSchema])),
});
