import { z } from "zod";

import { durationSchema } from "./duration";
import { durationTypeSchema } from "./duration-type";
import { equipmentSchema } from "./equipment";
import { intensitySchema } from "./intensity";
import { targetSchema } from "./target";
import { targetTypeSchema } from "./target-type";

/**
 * Zod schema for a workout step.
 *
 * Validates an individual interval or segment within a workout,
 * including duration, target, and intensity.
 */
export const workoutStepSchema = z
  .object({
    stepIndex: z.number().int().nonnegative(),
    name: z.string().optional(),
    durationType: durationTypeSchema,
    duration: durationSchema,
    targetType: targetTypeSchema,
    target: targetSchema,
    intensity: intensitySchema.optional(),
    notes: z.string().max(256).optional(),
    equipment: equipmentSchema.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((s) => s.durationType === s.duration.type, {
    message: "durationType must match duration.type",
    path: ["durationType"],
  })
  .refine((s) => s.targetType === s.target.type, {
    message: "targetType must match target.type",
    path: ["targetType"],
  });

/**
 * TypeScript type for a workout step, inferred from {@link workoutStepSchema}.
 *
 * Represents an individual interval or segment within a workout.
 */
export type WorkoutStep = z.infer<typeof workoutStepSchema>;
